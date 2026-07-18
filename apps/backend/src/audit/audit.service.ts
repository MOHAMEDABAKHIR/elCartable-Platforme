import { Injectable, Logger } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SearchAuditLogDto } from './dto/search-audit-log.dto';

const DEFAULT_LIMIT = 100;

export interface AuditLogInput {
  action: AuditAction;
  /** Auteur de l'action ; null pour une action publique/anonyme. */
  userId?: string | null;
  entityType?: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
}

/**
 * Traçabilité transverse : connexions/déconnexions, créations/modifications/
 * suppressions, téléchargements PDF, consultations et exports, sur n'importe
 * quelle entité. Distinct de `OrderHistory`, qui ne trace que le cycle de vie
 * métier d'une commande.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Enregistre une entrée d'audit. Volontairement tolérant aux erreurs : une
   * défaillance de traçabilité ne doit jamais faire échouer l'action métier
   * qui l'a déclenchée. L'échec est journalisé, pas propagé.
   */
  async log(input: AuditLogInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: input.action,
          userId: input.userId ?? null,
          entityType: input.entityType,
          entityId: input.entityId,
          metadata: input.metadata,
          ipAddress: input.ipAddress,
        },
      });
    } catch (error) {
      this.logger.error(
        `Échec de l'enregistrement d'audit (${input.action} ${input.entityType ?? ''} ${input.entityId ?? ''})`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /** Lecture filtrable du journal d'audit (Admin/SuperAdmin). */
  async findAll(query: SearchAuditLogDto) {
    const where: Prisma.AuditLogWhereInput = {
      ...(query.action ? { action: query.action } : {}),
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.entityType ? { entityType: query.entityType } : {}),
      ...(query.entityId ? { entityId: query.entityId } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    return this.prisma.auditLog.findMany({
      where,
      take: query.limit ?? DEFAULT_LIMIT,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, email: true, role: true } },
      },
    });
  }
}
