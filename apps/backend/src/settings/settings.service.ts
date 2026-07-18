import { Injectable } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ensureFound } from '../common/prisma/query.utils';

/**
 * Clés exposées publiquement (sans authentification) via `GET /settings/public`.
 * Toute clé absente de cette liste blanche reste réservée au back-office —
 * on n'expose jamais l'intégralité du store de configuration au public.
 */
const PUBLIC_SETTING_KEYS = ['whatsappSupportNumber', 'deliveryFreeThreshold', 'announcementBanner'];

/**
 * Store de configuration global clé/valeur (numéro WhatsApp de support,
 * seuils, bascules A/B testing...). `value` est un JSON libre, ce qui évite
 * une migration par nouveau paramètre.
 */
@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  findAll() {
    return this.prisma.setting.findMany({ orderBy: { key: 'asc' } });
  }

  async findOne(key: string) {
    return ensureFound(
      await this.prisma.setting.findUnique({ where: { key } }),
      `Paramètre introuvable : ${key}.`,
    );
  }

  /** Sous-ensemble exposable au front public (liste blanche), en map clé -> valeur. */
  async findPublic(): Promise<Record<string, Prisma.JsonValue>> {
    const settings = await this.prisma.setting.findMany({
      where: { key: { in: PUBLIC_SETTING_KEYS } },
    });
    return Object.fromEntries(settings.map((s) => [s.key, s.value]));
  }

  async upsert(key: string, value: unknown, actorId?: string) {
    const existing = await this.prisma.setting.findUnique({ where: { key } });
    const setting = await this.prisma.setting.upsert({
      where: { key },
      create: { key, value: value as Prisma.InputJsonValue },
      update: { value: value as Prisma.InputJsonValue },
    });

    await this.audit.log({
      action: existing ? AuditAction.UPDATE : AuditAction.CREATE,
      userId: actorId,
      entityType: 'Setting',
      entityId: key,
    });

    return setting;
  }

  async remove(key: string, actorId?: string) {
    await this.findOne(key); // 404 si absent
    await this.prisma.setting.delete({ where: { key } });

    await this.audit.log({
      action: AuditAction.DELETE,
      userId: actorId,
      entityType: 'Setting',
      entityId: key,
    });

    return { success: true };
  }
}
