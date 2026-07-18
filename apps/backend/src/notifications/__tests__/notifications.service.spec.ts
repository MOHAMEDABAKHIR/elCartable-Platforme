import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from '../notifications.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: { notification: Record<string, jest.Mock> };

  beforeEach(async () => {
    prisma = {
      notification: {
        create: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 3 }),
        count: jest.fn().mockResolvedValue(0),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [NotificationsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(NotificationsService);
  });

  describe('notify', () => {
    it('creates a notification for the target user', async () => {
      await service.notify({ userId: 'u1', title: 'Hi', message: 'Body' });
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ userId: 'u1', title: 'Hi', message: 'Body' }),
      });
    });

    it('never throws when persistence fails', async () => {
      prisma.notification.create.mockRejectedValue(new Error('db down'));
      await expect(service.notify({ userId: 'u1', title: 't', message: 'm' })).resolves.toBeUndefined();
    });
  });

  describe('findForUser', () => {
    it('filters to unread only when requested and applies the default limit', async () => {
      await service.findForUser('u1', { unreadOnly: true });
      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'u1', isRead: false },
        take: 50,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('markAsRead', () => {
    it("throws when the notification belongs to another user", async () => {
      prisma.notification.findUnique.mockResolvedValue({ id: 'n1', userId: 'other' });
      await expect(service.markAsRead('n1', 'u1')).rejects.toThrow(NotFoundException);
      expect(prisma.notification.update).not.toHaveBeenCalled();
    });

    it('marks the notification read when it belongs to the user', async () => {
      prisma.notification.findUnique.mockResolvedValue({ id: 'n1', userId: 'u1' });
      await service.markAsRead('n1', 'u1');
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'n1' },
        data: { isRead: true },
      });
    });
  });

  describe('markAllAsRead', () => {
    it('returns the number of notifications updated', async () => {
      const result = await service.markAllAsRead('u1');
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'u1', isRead: false },
        data: { isRead: true },
      });
      expect(result).toEqual({ updated: 3 });
    });
  });
});
