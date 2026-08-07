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
  constructor(private readonly prisma: PrismaService) { }

  async getOverview(query: DashboardQueryDto) {
  const period = buildDateRangeFilter(query.from, query.to);

 const [orders, visitors, revenueHistory,topProducts,topSchools ,latestOrders ,topCities , topGrades,lowStockProducts,activities,] = await Promise.all([
  this.getOrderMetrics(period),
  this.getVisitorMetrics(period),
  this.getRevenueHistory(period),
  this.getTopProducts(period),
  this.getTopSchools(period),
  this.getLatestOrders(period),
  this.getTopCities(period),
  this.getTopGrades(period),
  this.getLowStockProducts(),
  this.getActivities(),
  
]);

  return {
  period: query,
  orders,
  visitors,
  revenueHistory,
  topProducts,
  topSchools,
  latestOrders,
  topCities,
  topGrades,
  lowStockProducts,
  activities,
};
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
  private async getRevenueHistory(
  createdAt: Prisma.DateTimeFilter | undefined,
) {
  const where: Prisma.OrderWhereInput = {
    ...(createdAt ? { createdAt } : {}),
    status: {
      not: OrderStatus.CANCELLED,
    },
  };

  const orders = await this.prisma.order.findMany({
    where,
    select: {
      createdAt: true,
      totalAmount: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  const map = new Map<
    string,
    {
      date: string;
      revenue: number;
      orders: number;
    }
  >();

  for (const order of orders) {
    const date = order.createdAt.toISOString().slice(0, 10);

    if (!map.has(date)) {
      map.set(date, {
        date,
        revenue: 0,
        orders: 0,
      });
    }

    const current = map.get(date)!;

    current.revenue += Number(order.totalAmount);
    current.orders += 1;
  }

  return [...map.values()];
}
private async getTopProducts(
  createdAt: Prisma.DateTimeFilter | undefined,
) {
  const where: Prisma.OrderWhereInput = {
    ...(createdAt ? { createdAt } : {}),
    status: {
      not: OrderStatus.CANCELLED,
    },
  };

  const items = await this.prisma.orderItem.findMany({
    where: {
      order: where,
    },
    select: {
      productId: true,
      label: true,
      quantity: true,
      unitPrice: true,
    },
  });

  const map = new Map<
    string,
    {
      productId: string;
      name: string;
      quantity: number;
      revenue: number;
    }
  >();

  for (const item of items) {
    const key = item.productId ?? item.label;

    if (!map.has(key)) {
      map.set(key, {
        productId: item.productId ?? '',
        name: item.label,
        quantity: 0,
        revenue: 0,
      });
    }

    const current = map.get(key)!;

    current.quantity += item.quantity;
    current.revenue += Number(item.unitPrice) * item.quantity;
  }

  return [...map.values()]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);
}
private async getTopSchools(
  createdAt: Prisma.DateTimeFilter | undefined,
) {
  const where: Prisma.OrderWhereInput = {
    ...(createdAt ? { createdAt } : {}),
    status: {
      not: OrderStatus.CANCELLED,
    },
  };

  const orders = await this.prisma.order.findMany({
    where,
    select: {
      totalAmount: true,
      schoolId: true,
      school: {
        select: {
          name: true,
        },
      },
    },
  });

  const map = new Map<
    string,
    {
      schoolId: string;
      schoolName: string;
      orders: number;
      revenue: number;
    }
  >();

  for (const order of orders) {
    const key = order.schoolId ?? 'unknown';

    if (!map.has(key)) {
      map.set(key, {
        schoolId: order.schoolId ?? '',
        schoolName: order.school?.name ?? 'École inconnue',
        orders: 0,
        revenue: 0,
      });
    }

    const current = map.get(key)!;

    current.orders += 1;
    current.revenue += Number(order.totalAmount);
  }

  return [...map.values()]
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 10);
}
private async getLatestOrders(
  createdAt: Prisma.DateTimeFilter | undefined,
) {
  const where: Prisma.OrderWhereInput = createdAt
    ? { createdAt }
    : {};

  const orders = await this.prisma.order.findMany({
    where,
    take: 10,
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      status: true,
      totalAmount: true,
      createdAt: true,
    },
  });

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    status: order.status,
    total: Number(order.totalAmount),
    createdAt: order.createdAt,
  }));
}
private async getTopCities(
  createdAt: Prisma.DateTimeFilter | undefined,
) {
  const where: Prisma.OrderWhereInput = {
    ...(createdAt ? { createdAt } : {}),
    status: {
      not: OrderStatus.CANCELLED,
    },
  };

  const orders = await this.prisma.order.findMany({
    where,
    select: {
      totalAmount: true,
      school: {
        select: {
          city: true,
        },
      },
    },
  });

  const map = new Map<
    string,
    {
      city: string;
      orders: number;
      revenue: number;
    }
  >();

  for (const order of orders) {
    const city = order.school?.city ?? 'Inconnue';

    if (!map.has(city)) {
      map.set(city, {
        city,
        orders: 0,
        revenue: 0,
      });
    }

    const current = map.get(city)!;

    current.orders += 1;
    current.revenue += Number(order.totalAmount);
  }

  return [...map.values()]
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 10);
}
private async getTopGrades(
  createdAt: Prisma.DateTimeFilter | undefined,
) {
  const where: Prisma.OrderWhereInput = {
    ...(createdAt ? { createdAt } : {}),
    status: {
      not: OrderStatus.CANCELLED,
    },
  };

  const orders = await this.prisma.order.findMany({
    where,
    select: {
      totalAmount: true,
      gradeId: true,
      grade: {
        select: {
          name: true,
        },
      },
    },
  });

  const map = new Map<
    string,
    {
      gradeId: string;
      gradeName: string;
      orders: number;
      revenue: number;
    }
  >();

  for (const order of orders) {
    const key = order.gradeId ?? 'unknown';

    if (!map.has(key)) {
      map.set(key, {
        gradeId: order.gradeId ?? '',
        gradeName: order.grade?.name ?? 'Niveau inconnu',
        orders: 0,
        revenue: 0,
      });
    }

    const current = map.get(key)!;

    current.orders += 1;
    current.revenue += Number(order.totalAmount);
  }

  return [...map.values()]
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 10);
}
private async getLowStockProducts() {
  return this.prisma.product.findMany({
    where: {
      isActive: true,
      stock: {
        lte: 10,
      },
    },
    orderBy: {
      stock: 'asc',
    },
    take: 10,
    select: {
      id: true,
      name: true,
      stock: true,
      price: true,
    },
  });
}
private async getActivities() {
  const history = await this.prisma.orderHistory.findMany({
    take: 15,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      user: {
        select: {
          fullName: true,
        },
      },
      order: {
        select: {
          orderNumber: true,
        },
      },
    },
  });

  return history.map((item) => ({
    id: item.id,
    action: item.action,
    orderNumber: item.order.orderNumber,
    user: item.user?.fullName ?? 'Système',
    createdAt: item.createdAt,
  }));
}
}
