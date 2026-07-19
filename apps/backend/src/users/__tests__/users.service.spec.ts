import { Test } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { UsersService } from '../users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: { user: Record<string, jest.Mock> };
  let audit: { log: jest.Mock };

  const admin: AuthenticatedUser = {
    id: 'admin-1',
    email: 'admin@a.com',
    role: UserRole.ADMIN,
    fullName: 'Admin',
  };
  const superAdmin: AuthenticatedUser = {
    id: 'sa-1',
    email: 'sa@a.com',
    role: UserRole.SUPER_ADMIN,
    fullName: 'Super Admin',
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = moduleRef.get(UsersService);
  });

  describe('findAll', () => {
    it('restricts an Admin to COMMERCIAL accounts only, regardless of query', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      await service.findAll({}, admin);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ role: { in: [UserRole.COMMERCIAL] } }),
        }),
      );
    });

    it('throws ForbiddenException when an Admin explicitly requests role=ADMIN', async () => {
      await expect(service.findAll({ role: UserRole.ADMIN }, admin)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('lets a SuperAdmin see both ADMIN and COMMERCIAL by default', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      await service.findAll({}, superAdmin);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: { in: [UserRole.ADMIN, UserRole.COMMERCIAL] },
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException (not Forbidden) when an Admin looks up another Admin', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'x', role: UserRole.ADMIN });
      await expect(service.findOne('x', admin)).rejects.toThrow(NotFoundException);
    });

    it('returns the user when in scope', async () => {
      const target = { id: 'x', role: UserRole.COMMERCIAL };
      prisma.user.findUnique.mockResolvedValue(target);
      const result = await service.findOne('x', admin);
      expect(result).toBe(target);
    });
  });

  describe('deactivate', () => {
    it('rejects self-deactivation', async () => {
      await expect(service.deactivate(admin.id, admin)).rejects.toThrow(BadRequestException);
    });

    it('deactivates an in-scope user and logs an audit entry', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'x', role: UserRole.COMMERCIAL });
      prisma.user.update.mockResolvedValue({ id: 'x', role: UserRole.COMMERCIAL, isActive: false });

      await service.deactivate('x', admin);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'x' }, data: { isActive: false } }),
      );
      expect(audit.log).toHaveBeenCalled();
    });
  });
});
