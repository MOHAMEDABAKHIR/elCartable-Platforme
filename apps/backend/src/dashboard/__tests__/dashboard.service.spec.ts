import { Test } from '@nestjs/testing';
import { OrderStatus, Prisma } from '@prisma/client';
import { DashboardService } from '../dashboard.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: {
    order: Record<string, jest.Mock>;
    analyticsEvent: Record<string, jest.Mock>;
    visitorSession: Record<string, jest.Mock>;
    visitor: Record<string, jest.Mock>;
  };

  beforeEach(async () => {
    prisma = {
      order: {
        groupBy: jest.fn().mockResolvedValue([]),
        aggregate: jest.fn().mockResolvedValue({
          _sum: { totalAmount: null },
          _avg: { totalAmount: null },
          _count: { _all: 0 },
        }),
      },
      analyticsEvent: { findMany: jest.fn().mockResolvedValue([]) },
      visitorSession: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
      },
      visitor: { count: jest.fn().mockResolvedValue(0) },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [DashboardService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(DashboardService);
  });

  describe('getOverview — orders', () => {
    it('sums order counts by status and excludes cancelled orders from revenue/average', async () => {
      prisma.order.groupBy.mockResolvedValue([
        { status: OrderStatus.CREATED, _count: { _all: 2 } },
        { status: OrderStatus.DELIVERED, _count: { _all: 3 } },
        { status: OrderStatus.CANCELLED, _count: { _all: 1 } },
      ]);
      prisma.order.aggregate.mockResolvedValue({
        _sum: { totalAmount: new Prisma.Decimal(500) },
        _avg: { totalAmount: new Prisma.Decimal(100) },
        _count: { _all: 5 },
      });

      const result = await service.getOverview({});

      expect(result.orders.totalOrders).toBe(6);
      expect(result.orders.byStatus[OrderStatus.CANCELLED]).toBe(1);
      expect(result.orders.totalRevenue.toString()).toBe('500');
      expect(result.orders.averageCartValue.toString()).toBe('100');

      const aggregateCallArg = prisma.order.aggregate.mock.calls[0][0];
      expect(aggregateCallArg.where.status).toEqual({ not: OrderStatus.CANCELLED });
    });

    it('applies the from/to filter to createdAt when provided', async () => {
      await service.getOverview({ from: '2026-01-01T00:00:00.000Z', to: '2026-01-31T23:59:59.000Z' });

      const groupByArg = prisma.order.groupBy.mock.calls[0][0];
      expect(groupByArg.where.createdAt).toEqual({
        gte: new Date('2026-01-01T00:00:00.000Z'),
        lte: new Date('2026-01-31T23:59:59.000Z'),
      });
    });
  });

  describe('getOverview — visitors/abandonment', () => {
    it('computes a 0% abandonment rate when there are no ADD_TO_CART sessions', async () => {
      const result = await service.getOverview({});
      expect(result.visitors.abandonmentRate).toBe(0);
      expect(result.visitors.averageTimeToConversionSeconds).toBeNull();
    });

    it('counts a session as abandoned when it added to cart but never converted', async () => {
      prisma.analyticsEvent.findMany.mockImplementation(({ where }: any) => {
        if (where.type === 'ADD_TO_CART') {
          return Promise.resolve([{ sessionId: 's1' }, { sessionId: 's2' }]);
        }
        if (where.type === 'CONVERSION') {
          return Promise.resolve([{ sessionId: 's1', createdAt: new Date('2026-01-01T10:05:00Z') }]);
        }
        return Promise.resolve([]);
      });
      prisma.visitorSession.findMany.mockResolvedValue([
        { id: 's1', startedAt: new Date('2026-01-01T10:00:00Z') },
      ]);

      const result = await service.getOverview({});

      expect(result.visitors.addToCartSessions).toBe(2);
      expect(result.visitors.convertedSessions).toBe(1);
      expect(result.visitors.abandonmentRate).toBe(0.5);
      expect(result.visitors.averageTimeToConversionSeconds).toBe(300);
    });
  });
});
