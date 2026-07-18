import { ArgumentsHost, HttpStatus, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AllExceptionsFilter } from '../all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let json: jest.Mock;
  let status: jest.Mock;
  let host: ArgumentsHost;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    // Silence the server-side error log during tests.
    jest.spyOn((filter as unknown as { logger: { error: jest.Mock } }).logger, 'error').mockImplementation();

    json = jest.fn();
    status = jest.fn(() => ({ json }));
    host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ method: 'POST', url: '/api/v1/test' }),
      }),
    } as unknown as ArgumentsHost;
  });

  const captured = () => json.mock.calls[0][0] as { statusCode: number; code: string };

  it('propagates HttpException status and name', () => {
    filter.catch(new NotFoundException('Introuvable.'), host);
    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(captured().code).toBe('NotFoundException');
  });

  it('maps Prisma unique constraint (P2002) to 409', () => {
    const err = new Prisma.PrismaClientKnownRequestError('dup', {
      code: 'P2002',
      clientVersion: '5.0.0',
      meta: { target: ['email'] },
    });
    filter.catch(err, host);
    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(captured().code).toBe('UNIQUE_CONSTRAINT_VIOLATION');
  });

  it('maps Prisma foreign key violation (P2003) to 400', () => {
    const err = new Prisma.PrismaClientKnownRequestError('fk', {
      code: 'P2003',
      clientVersion: '5.0.0',
    });
    filter.catch(err, host);
    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(captured().code).toBe('FOREIGN_KEY_CONSTRAINT_VIOLATION');
  });

  it('does not mask an unknown Prisma error as a client 400', () => {
    const err = new Prisma.PrismaClientKnownRequestError('timeout', {
      code: 'P2024',
      clientVersion: '5.0.0',
    });
    filter.catch(err, host);
    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(captured().code).toBe('PRISMA_P2024');
  });

  it('maps Prisma initialization failure to 503', () => {
    const err = new Prisma.PrismaClientInitializationError('db down', '5.0.0');
    filter.catch(err, host);
    expect(status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
    expect(captured().code).toBe('DATABASE_UNAVAILABLE');
  });

  it('falls back to a generic 500 for unknown errors', () => {
    filter.catch(new Error('boom'), host);
    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(captured().code).toBe('INTERNAL_SERVER_ERROR');
  });

  it('never leaks internal details for a non-HTTP error', () => {
    filter.catch(new Error('secret stack detail'), host);
    expect(captured()).toMatchObject({ message: 'Une erreur interne est survenue.' });
  });
});
