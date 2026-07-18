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

    // La base est injoignable / mal configurée : c'est une indisponibilité
    // serveur (503), pas une erreur du client.
    if (exception instanceof Prisma.PrismaClientInitializationError) {
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Service momentanément indisponible, réessayez plus tard.',
        code: 'DATABASE_UNAVAILABLE',
      };
    }

    // Tout le reste (y compris une requête Prisma mal formée
    // `PrismaClientValidationError`, qui est un bug serveur, jamais la faute
    // du client) reste une erreur interne générique.
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
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Référence invalide : une ressource liée est introuvable.',
          code: 'FOREIGN_KEY_CONSTRAINT_VIOLATION',
        };
      default:
        // Tout autre code Prisma connu (timeout P2024, erreur de connexion,
        // etc.) est un défaut serveur : le renvoyer en 400 masquerait un
        // vrai problème d'infrastructure derrière une "faute du client".
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Une erreur interne est survenue.',
          code: `PRISMA_${exception.code}`,
        };
    }
  }
}
