import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { buildDateRangeFilter, ensureFound } from '../common/prisma/query.utils';
import { CreateAnalyticsEventDto } from './dto/create-analytics-event.dto';
import { SearchAnalyticsEventDto } from './dto/search-analytics-event.dto';

/**
 * Ce module se limite à l'ingestion et à la lecture brute des événements.
 * Le calcul des métriques dérivées (panier moyen, taux d'abandon, temps
 * moyen avant validation) est porté par le futur module `Dashboard`
 * (étape 7 de la feuille de route), qui agrège ces événements avec les
 * données `Order` — pas de duplication de logique d'agrégation ici.
 */
@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAnalyticsEventDto) {
    const session = await this.prisma.visitorSession.findUnique({ where: { id: dto.sessionId } });
    ensureFound(session, 'Session visiteur introuvable.');

    return this.prisma.analyticsEvent.create({
      data: {
        sessionId: dto.sessionId,
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
}
