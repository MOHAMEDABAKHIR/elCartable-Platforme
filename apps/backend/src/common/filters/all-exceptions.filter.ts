import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

/**
 * Catches every unhandled exception (HTTP, Prisma, or unknown) and returns a
 * consistent JSON error shape, while logging full details server-side.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message, code } = this.resolve(exception);

    this.logger.error(
      `${request.method} ${request.url} -> ${status} ${JSON.stringify(message)}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
      code,
      message,
    });
  }

  private resolve(exception: unknown): { status: number; message: unknown; code: string } {
    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      return {
        status: exception.getStatus(),
        message: typeof body === 'string' ? body : (body as any).message ?? body,
        code: exception.constructor.name,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.resolvePrismaError(exception);
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Une erreur interne est survenue.',
      code: 'INTERNAL_SERVER_ERROR',
    };
  }

  private resolvePrismaError(exception: Prisma.PrismaClientKnownRequestError) {
    switch (exception.code) {
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          message: `Une ressource avec cette valeur existe déjà (${(exception.meta?.target as string[])?.join(', ')}).`,
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
        };
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Ressource introuvable.',
          code: 'RECORD_NOT_FOUND',
        };
      default:
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Erreur de base de données.',
          code: `PRISMA_${exception.code}`,
        };
    }
  }
}
