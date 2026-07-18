import { Injectable } from '@nestjs/common';
import { AnalyticsEventType, OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { buildDateRangeFilter } from '../common/prisma/query.utils';

/**
 * Module d'agrégation pour le back-office Admin/SuperAdmin. Ne stocke
 * aucune donnée propre : il lit et combine `Order` (commercial) et
 * `AnalyticsEvent`/`VisitorSession` (comportement visiteur), conformément à
 * la décision d'architecture "Analytics générique par événements" — les
 * métriques dérivées se calculent ici par agrégation, pas dans le module
 * Analytics lui-même.
 */
@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(query: DashboardQueryDto) {
    const period = buildDateRangeFilter(query.from, query.to);

    const [orders, visitors] = await Promise.all([
      this.getOrderMetrics(period),
      this.getVisitorMetrics(period),
    ]);

    return { period: query, orders, visitors };
  }

  // ---------------------------------------------------------------------

  private async getOrderMetrics(createdAt: Prisma.DateTimeFilter | undefined) {
    const where: Prisma.OrderWhereInput = createdAt ? { createdAt } : {};

    const [byStatus, revenueAgg] = await Promise.all([
      this.prisma.order.groupBy({ by: ['status'], where, _count: { _all: true } }),
      this.prisma.order.aggregate({
        where: { ...where, status: { not: OrderStatus.CANCELLED } },
        _sum: { totalAmount: true },
        _avg: { totalAmount: true },
        _count: { _all: true },
      }),
    ]);

    const byStatusMap = Object.fromEntries(
      byStatus.map((row) => [row.status, row._count._all]),
    ) as Record<OrderStatus, number>;
    const totalOrders = byStatus.reduce((sum, row) => sum + row._count._all, 0);

    return {
      totalOrders,
      byStatus: byStatusMap,
      totalRevenue: revenueAgg._sum.totalAmount ?? new Prisma.Decimal(0),
      averageCartValue: revenueAgg._avg.totalAmount ?? new Prisma.Decimal(0),
      // le nombre de commandes non-annulées sert de dénominateur pour le panier moyen
      nonCancelledOrders: revenueAgg._count._all,
    };
  }

  /**
   * Taux d'abandon = sessions ayant ajouté un article au panier (ADD_TO_CART)
   * mais jamais converties (aucun événement CONVERSION) / total de sessions
   * ayant ajouté un article. Temps moyen avant validation = écart moyen
   * entre le début de session et l'événement CONVERSION, pour les sessions
   * converties.
   */
  private async getVisitorMetrics(createdAt: Prisma.DateTimeFilter | undefined) {
    const eventWhere = createdAt ? { createdAt } : {};

    const [addToCartEvents, conversionEvents, sessionsCount, visitorsCount] = await Promise.all([
      this.prisma.analyticsEvent.findMany({
        where: { ...eventWhere, type: AnalyticsEventType.ADD_TO_CART },
        select: { sessionId: true },
        distinct: ['sessionId'],
      }),
      this.prisma.analyticsEvent.findMany({
        where: { ...eventWhere, type: AnalyticsEventType.CONVERSION },
        select: { sessionId: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.visitorSession.count({
        where: createdAt ? { startedAt: createdAt } : {},
      }),
      this.prisma.visitor.count({
        where: createdAt ? { firstSeen: createdAt } : {},
      }),
    ]);

    const addToCartSessionIds = new Set(addToCartEvents.map((e) => e.sessionId));
    const firstConversionBySession = new Map<string, Date>();
    for (const event of conversionEvents) {
      if (!firstConversionBySession.has(event.sessionId)) {
        firstConversionBySession.set(event.sessionId, event.createdAt);
      }
    }

    const abandonedSessions = [...addToCartSessionIds].filter(
      (id) => !firstConversionBySession.has(id),
    );
    const abandonmentRate =
      addToCartSessionIds.size > 0 ? abandonedSessions.length / addToCartSessionIds.size : 0;

    const averageTimeToConversionSeconds = await this.computeAverageTimeToConversion(
      firstConversionBySession,
    );

    return {
      sessionsCount,
      newVisitorsCount: visitorsCount,
      addToCartSessions: addToCartSessionIds.size,
      convertedSessions: firstConversionBySession.size,
      abandonmentRate,
      averageTimeToConversionSeconds,
    };
  }

  private async computeAverageTimeToConversion(
    firstConversionBySession: Map<string, Date>,
  ): Promise<number | null> {
    if (firstConversionBySession.size === 0) {
      return null;
    }

    const sessions = await this.prisma.visitorSession.findMany({
      where: { id: { in: [...firstConversionBySession.keys()] } },
      select: { id: true, startedAt: true },
    });
    const startedAtBySession = new Map(sessions.map((s) => [s.id, s.startedAt]));

    let totalSeconds = 0;
    let count = 0;
    for (const [sessionId, convertedAt] of firstConversionBySession) {
      const startedAt = startedAtBySession.get(sessionId);
      if (!startedAt) {
        continue;
      }
      totalSeconds += (convertedAt.getTime() - startedAt.getTime()) / 1000;
      count += 1;
    }

    return count > 0 ? totalSeconds / count : null;
  }
}
