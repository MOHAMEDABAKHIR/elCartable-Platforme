import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VisitorsService } from '../visitors.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('VisitorsService', () => {
  let service: VisitorsService;
  let prisma: {
    visitor: Record<string, jest.Mock>;
    visitorSession: Record<string, jest.Mock>;
  };

  beforeEach(async () => {
    prisma = {
      visitor: {
        upsert: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      visitorSession: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        VisitorsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: { get: () => 'test-salt' } },
      ],
    }).compile();

    service = moduleRef.get(VisitorsService);
  });

  describe('hashIp', () => {
    it('returns undefined when no IP is given', () => {
      expect(service.hashIp(undefined)).toBeUndefined();
    });

    it('returns a stable hash for the same IP', () => {
      const a = service.hashIp('1.2.3.4');
      const b = service.hashIp('1.2.3.4');
      expect(a).toBe(b);
      expect(a).not.toContain('1.2.3.4'); // never leaks the raw IP
    });

    it('never returns the plain IP as the hash', () => {
      const hash = service.hashIp('5.6.7.8');
      expect(hash).not.toBe('5.6.7.8');
    });
  });

  describe('identify', () => {
    it('upserts the visitor by anonId and hashes the IP rather than storing it raw', async () => {
      prisma.visitor.upsert.mockResolvedValue({ id: 'v1', anonId: 'anon-123' });

      await service.identify({ anonId: 'anon-123' }, '9.9.9.9');

      const callArg = prisma.visitor.upsert.mock.calls[0][0];
      expect(callArg.where).toEqual({ anonId: 'anon-123' });
      expect(callArg.create.ipHash).toBeDefined();
      expect(callArg.create.ipHash).not.toBe('9.9.9.9');
    });
  });

  describe('startSession', () => {
    it('creates the visitor (upsert) then a session linked to it', async () => {
      prisma.visitor.upsert.mockResolvedValue({ id: 'v1' });
      prisma.visitorSession.create.mockResolvedValue({ id: 's1', visitorId: 'v1' });

      const result = await service.startSession({ anonId: 'anon-123', entryPage: '/' });

      expect(prisma.visitorSession.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ visitorId: 'v1', entryPage: '/' }) }),
      );
      expect(result).toEqual({ id: 's1', visitorId: 'v1' });
    });
  });

  describe('endSession', () => {
    it('throws NotFoundException when the session does not exist', async () => {
      prisma.visitorSession.findUnique.mockResolvedValue(null);

      await expect(service.endSession('missing', {})).rejects.toThrow(NotFoundException);
    });

    it('sets endedAt and exitPage when the session exists', async () => {
      prisma.visitorSession.findUnique.mockResolvedValue({ id: 's1' });
      prisma.visitorSession.update.mockResolvedValue({ id: 's1', endedAt: new Date() });

      await service.endSession('s1', { exitPage: '/checkout/confirmation' });

      expect(prisma.visitorSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 's1' },
          data: expect.objectContaining({ exitPage: '/checkout/confirmation' }),
        }),
      );
    });
  });
});
