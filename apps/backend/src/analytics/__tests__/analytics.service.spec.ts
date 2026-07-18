import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AnalyticsEventType } from '@prisma/client';
import { AnalyticsService } from '../analytics.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: {
    visitorSession: Record<string, jest.Mock>;
    analyticsEvent: Record<string, jest.Mock>;
  };

  beforeEach(async () => {
    prisma = {
      visitorSession: { findUnique: jest.fn() },
      analyticsEvent: { create: jest.fn(), findMany: jest.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [AnalyticsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(AnalyticsService);
  });

  describe('create', () => {
    it('throws NotFoundException when the session does not exist', async () => {
      prisma.visitorSession.findUnique.mockResolvedValue(null);

      await expect(
        service.create({ sessionId: 'missing', type: AnalyticsEventType.PAGE_VIEW }),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates the event when the session exists', async () => {
      prisma.visitorSession.findUnique.mockResolvedValue({ id: 's1' });
      prisma.analyticsEvent.create.mockResolvedValue({ id: 'e1' });

      await service.create({
        sessionId: 's1',
        type: AnalyticsEventType.ADD_TO_CART,
        metadata: { productId: 'p1' },
      });

      expect(prisma.analyticsEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ sessionId: 's1', type: AnalyticsEventType.ADD_TO_CART }),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('filters by type when provided', async () => {
      prisma.analyticsEvent.findMany.mockResolvedValue([]);

      await service.findAll({ type: AnalyticsEventType.CONVERSION });

      expect(prisma.analyticsEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ type: AnalyticsEventType.CONVERSION }) }),
      );
    });
  });
});
