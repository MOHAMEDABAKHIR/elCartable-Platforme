import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { SettingsService } from '../settings.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';

describe('SettingsService', () => {
  let service: SettingsService;
  let prisma: { setting: Record<string, jest.Mock> };
  let audit: { log: jest.Mock };

  beforeEach(async () => {
    prisma = {
      setting: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        upsert: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({}),
      },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = moduleRef.get(SettingsService);
  });

  describe('findPublic', () => {
    it('returns only whitelisted keys as a key -> value map', async () => {
      prisma.setting.findMany.mockResolvedValue([
        { key: 'whatsappSupportNumber', value: '+212600000000' },
      ]);

      const result = await service.findPublic();

      expect(prisma.setting.findMany).toHaveBeenCalledWith({
        where: { key: { in: expect.arrayContaining(['whatsappSupportNumber']) } },
      });
      expect(result).toEqual({ whatsappSupportNumber: '+212600000000' });
    });
  });

  describe('upsert', () => {
    it('logs a CREATE audit entry when the key did not exist', async () => {
      prisma.setting.findUnique.mockResolvedValue(null);

      await service.upsert('newKey', 42, 'user-1');

      expect(prisma.setting.upsert).toHaveBeenCalledWith({
        where: { key: 'newKey' },
        create: { key: 'newKey', value: 42 },
        update: { value: 42 },
      });
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.CREATE, entityType: 'Setting', entityId: 'newKey' }),
      );
    });

    it('logs an UPDATE audit entry when the key already existed', async () => {
      prisma.setting.findUnique.mockResolvedValue({ key: 'k', value: 'old' });

      await service.upsert('k', 'new', 'user-1');

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.UPDATE, entityId: 'k' }),
      );
    });
  });

  describe('remove', () => {
    it('throws when the key does not exist and does not delete', async () => {
      prisma.setting.findUnique.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
      expect(prisma.setting.delete).not.toHaveBeenCalled();
    });

    it('deletes and logs a DELETE audit entry', async () => {
      prisma.setting.findUnique.mockResolvedValue({ key: 'k', value: 'v' });

      const result = await service.remove('k', 'user-1');

      expect(prisma.setting.delete).toHaveBeenCalledWith({ where: { key: 'k' } });
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.DELETE, entityId: 'k' }),
      );
      expect(result).toEqual({ success: true });
    });
  });
});
