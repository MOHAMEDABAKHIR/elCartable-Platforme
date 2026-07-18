import { Test } from '@nestjs/testing';
import { AuditAction } from '@prisma/client';
import { AuditService } from '../audit.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: { auditLog: { create: jest.Mock; findMany: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      auditLog: {
        create: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [AuditService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(AuditService);
  });

  describe('log', () => {
    it('persists an audit entry, defaulting userId to null for anonymous actions', async () => {
      await service.log({
        action: AuditAction.VIEW,
        entityType: 'Order',
        entityId: 'o1',
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: AuditAction.VIEW,
          userId: null,
          entityType: 'Order',
          entityId: 'o1',
        }),
      });
    });

    it('never throws when persistence fails — tracing must not break the business action', async () => {
      prisma.auditLog.create.mockRejectedValue(new Error('db down'));

      await expect(service.log({ action: AuditAction.LOGIN })).resolves.toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('applies filters, a date range, and caps results with the default limit', async () => {
      await service.findAll({
        action: AuditAction.DELETE,
        entityType: 'Product',
        from: '2026-01-01T00:00:00.000Z',
        to: '2026-01-31T23:59:59.000Z',
      });

      const arg = prisma.auditLog.findMany.mock.calls[0][0];
      expect(arg.where.action).toBe(AuditAction.DELETE);
      expect(arg.where.entityType).toBe('Product');
      expect(arg.where.createdAt).toEqual({
        gte: new Date('2026-01-01T00:00:00.000Z'),
        lte: new Date('2026-01-31T23:59:59.000Z'),
      });
      expect(arg.take).toBe(100);
      expect(arg.orderBy).toEqual({ createdAt: 'desc' });
    });

    it('honours a caller-supplied limit', async () => {
      await service.findAll({ limit: 25 });
      expect(prisma.auditLog.findMany.mock.calls[0][0].take).toBe(25);
    });
  });
});
