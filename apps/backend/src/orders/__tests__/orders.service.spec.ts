import { Test } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrderHistoryAction, OrderStatus, Prisma } from '@prisma/client';
import { OrdersService } from '../orders.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let notifications: { notify: jest.Mock };
  let prisma: {
    order: Record<string, jest.Mock>;
    orderItem: Record<string, jest.Mock>;
    orderHistory: Record<string, jest.Mock>;
    product: Record<string, jest.Mock>;
    user: Record<string, jest.Mock>;
  };

  beforeEach(async () => {
    prisma = {
      order: {
        create: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      orderItem: {
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      orderHistory: {
        create: jest.fn(),
        createMany: jest.fn(),
      },
      product: { findUnique: jest.fn() },
      user: { findUnique: jest.fn() },
    };

    notifications = { notify: jest.fn().mockResolvedValue(undefined) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = moduleRef.get(OrdersService);
  });

  const baseCreateDto = {
    customerName: 'Fatima Zahra',
    customerPhone: '0612345678',
    items: [{ label: 'Cahier libre', quantity: 2, unitPrice: 15 }],
  } as any;

  describe('create', () => {
    it('uses the catalog price/label when productId is provided, ignoring client-supplied price', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        name: 'Cahier 96p',
        price: new Prisma.Decimal(20),
        isActive: true,
      });
      prisma.order.create.mockResolvedValue({ id: 'o1' });

      await service.create({
        ...baseCreateDto,
        items: [{ productId: 'p1', label: 'ignored', quantity: 3 } as any],
      });

      const callArg = prisma.order.create.mock.calls[0][0];
      expect(callArg.data.items.create[0]).toMatchObject({
        productId: 'p1',
        label: 'Cahier 96p',
        quantity: 3,
      });
    });

    it('throws NotFoundException when productId does not match an active product', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          ...baseCreateDto,
          items: [{ productId: 'missing', label: 'x', quantity: 1 } as any],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('retries order number generation on a unique constraint collision', async () => {
      const collision = new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: '5.0.0',
      });
      prisma.order.create.mockRejectedValueOnce(collision).mockResolvedValueOnce({ id: 'o2' });

      const result = await service.create(baseCreateDto);

      expect(prisma.order.create).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ id: 'o2' });
    });

    it('computes totalAmount from quantity * unitPrice across items', async () => {
      prisma.order.create.mockResolvedValue({ id: 'o3' });

      await service.create(baseCreateDto);

      const callArg = prisma.order.create.mock.calls[0][0];
      expect(callArg.data.totalAmount.toString()).toBe('30');
    });
  });

  describe('track', () => {
    it('throws NotFoundException when phone does not match the order', async () => {
      prisma.order.findUnique.mockResolvedValue({ orderNumber: 'ELC-2026-000001', customerPhone: '0600000000' });

      await expect(
        service.track({ orderNumber: 'ELC-2026-000001', customerPhone: '0611111111' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns the order when the phone matches', async () => {
      const order = { orderNumber: 'ELC-2026-000001', customerPhone: '0611111111' };
      prisma.order.findUnique.mockResolvedValue(order);

      const result = await service.track({
        orderNumber: 'ELC-2026-000001',
        customerPhone: '0611111111',
      });

      expect(result).toBe(order);
    });
  });

  describe('updateStatus', () => {
    it('throws BadRequestException on a backward transition', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'o1',
        status: OrderStatus.PREPARING,
        items: [],
      });

      await expect(
        service.updateStatus('o1', { status: OrderStatus.AWAITING_CALL }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows cancelling from any non-terminal status', async () => {
      prisma.order.findUnique
        .mockResolvedValueOnce({ id: 'o1', status: OrderStatus.PREPARING, items: [] })
        .mockResolvedValueOnce({ id: 'o1', status: OrderStatus.CANCELLED, items: [] });
      prisma.order.update.mockResolvedValue({ id: 'o1', status: OrderStatus.CANCELLED });

      await service.updateStatus('o1', { status: OrderStatus.CANCELLED }, 'user-1');

      expect(prisma.orderHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: OrderHistoryAction.STATUS_CHANGED }),
        }),
      );
    });

    it('throws ForbiddenException when the order is already in a terminal state', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'o1',
        status: OrderStatus.DELIVERED,
        items: [],
      });

      await expect(
        service.updateStatus('o1', { status: OrderStatus.CANCELLED }, 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('notifies the assigned commercial of the status change', async () => {
      prisma.order.findUnique
        .mockResolvedValueOnce({
          id: 'o1',
          orderNumber: 'ELC-2026-000001',
          status: OrderStatus.CALLING,
          commercialId: 'com-1',
          items: [],
        })
        .mockResolvedValueOnce({ id: 'o1', status: OrderStatus.CONFIRMED, items: [] });
      prisma.order.update.mockResolvedValue({ id: 'o1', status: OrderStatus.CONFIRMED });

      await service.updateStatus('o1', { status: OrderStatus.CONFIRMED }, 'user-1');

      expect(notifications.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'com-1',
          metadata: expect.objectContaining({ orderId: 'o1', status: OrderStatus.CONFIRMED }),
        }),
      );
    });

    it('does not notify when no commercial is assigned', async () => {
      prisma.order.findUnique
        .mockResolvedValueOnce({ id: 'o1', status: OrderStatus.CALLING, items: [] })
        .mockResolvedValueOnce({ id: 'o1', status: OrderStatus.CONFIRMED, items: [] });
      prisma.order.update.mockResolvedValue({ id: 'o1' });

      await service.updateStatus('o1', { status: OrderStatus.CONFIRMED }, 'user-1');

      expect(notifications.notify).not.toHaveBeenCalled();
    });

    it('logs an extra ORDER_CONFIRMED entry when moving to CONFIRMED', async () => {
      prisma.order.findUnique
        .mockResolvedValueOnce({ id: 'o1', status: OrderStatus.CALLING, items: [] })
        .mockResolvedValueOnce({ id: 'o1', status: OrderStatus.CONFIRMED, items: [] });
      prisma.order.update.mockResolvedValue({ id: 'o1', status: OrderStatus.CONFIRMED });

      await service.updateStatus('o1', { status: OrderStatus.CONFIRMED }, 'user-1');

      expect(prisma.orderHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: OrderHistoryAction.ORDER_CONFIRMED }),
        }),
      );
    });
  });

  describe('removeItem', () => {
    it('throws BadRequestException when removing the last remaining item', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'o1',
        status: OrderStatus.CREATED,
        items: [{ id: 'item-1', label: 'Cahier', quantity: 1 }],
      });

      await expect(service.removeItem('o1', 'item-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
