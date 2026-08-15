import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { buildDateRangeFilter } from '../common/prisma/query.utils';
import { CreateAnalyticsEventDto } from './dto/create-analytics-event.dto';
import { SearchAnalyticsEventDto } from './dto/search-analytics-event.dto';
import { CreateSessionDto } from './dto/create-session.dto';

/**
 * Ce module se limite à l'ingestion et à la lecture brute des événements.
 * Le calcul des métriques dérivées (panier moyen, taux d'abandon, temps
 * moyen avant validation) est porté par le futur module `Dashboard`
 * (étape 7 de la feuille de route), qui agrège ces événements avec les
 * données `Order` — pas de duplication de logique d'agrégation ici.
 */
@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Enregistre un événement analytics. Si la session référencée n'existe
   * plus (DB nettoyée, session expirée, désynchro front/back...), on ne
   * fait pas échouer l'ingestion : on récupère/recrée une session à la
   * volée plutôt que de renvoyer un 404 qui polluerait les logs en boucle
   * côté front sans jamais se rattraper.
   */
  async create(dto: CreateAnalyticsEventDto) {
    let session = await this.prisma.visitorSession.findUnique({ where: { id: dto.sessionId } });

    if (!session) {
      session = await this.recoverSession(dto.anonId);
    }

    return this.prisma.analyticsEvent.create({
      data: {
        sessionId: session.id,
        type: dto.type,
        path: dto.path,
        metadata: dto.metadata as Prisma.InputJsonValue,
      },
    });
  }

  async findAll(query: SearchAnalyticsEventDto) {
    const createdAt = buildDateRangeFilter(query.from, query.to);
    const where: Prisma.AnalyticsEventWhereInput = {
      ...(query.type ? { type: query.type } : {}),
      ...(query.sessionId ? { sessionId: query.sessionId } : {}),
      ...(createdAt ? { createdAt } : {}),
    };

    return this.prisma.analyticsEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSession(dto: CreateSessionDto) {
    let visitor = await this.prisma.visitor.findUnique({
      where: { anonId: dto.anonId },
    });

    if (!visitor) {
      visitor = await this.prisma.visitor.create({
        data: {
          anonId: dto.anonId,
          userAgent: dto.userAgent,
          sessionsCount: 1,
        },
      });
    } else {
      visitor = await this.prisma.visitor.update({
        where: { id: visitor.id },
        data: {
          sessionsCount: {
            increment: 1,
          },
        },
      });
    }

    return this.prisma.visitorSession.create({
      data: {
        visitorId: visitor.id,
        entryPage: dto.entryPage,
      },
    });
  }

  /**
   * Récupère (ou crée) une session valide quand celle envoyée par le client
   * n'existe plus en base. Rattache au visiteur connu via `anonId` si fourni,
   * sinon crée un visiteur "récupéré" jetable plutôt que de bloquer l'event.
   */
  private async recoverSession(anonId?: string) {
    const resolvedAnonId = anonId ?? `recovered_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const visitor = await this.prisma.visitor.upsert({
      where: { anonId: resolvedAnonId },
      update: { sessionsCount: { increment: 1 } },
      create: { anonId: resolvedAnonId, sessionsCount: 1 },
    });

    return this.prisma.visitorSession.create({
      data: { visitorId: visitor.id },
    });
  }
}