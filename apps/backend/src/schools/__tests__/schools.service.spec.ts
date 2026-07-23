import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SchoolsService } from '../schools.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';

describe('SchoolsService', () => {
  let service: SchoolsService;
  let prisma: { school: Record<string, jest.Mock> };

  beforeEach(async () => {
    prisma = {
      school: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        SchoolsService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: { upload: jest.fn(), remove: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(SchoolsService);
  });

  it('searchPublic filters to active schools only, with free-text search', async () => {
    prisma.school.findMany.mockResolvedValue([]);
    await service.searchPublic({ search: 'Massar' });

    expect(prisma.school.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: true }),
      }),
    );
  });

  it('findOne throws NotFoundException when school does not exist', async () => {
    prisma.school.findUnique.mockResolvedValue(null);
    await expect(service.findOne('missing-id')).rejects.toThrow(NotFoundException);
  });

  it('deactivate sets isActive to false rather than deleting', async () => {
    prisma.school.findUnique.mockResolvedValue({ id: '1', isActive: true });
    prisma.school.update.mockResolvedValue({ id: '1', isActive: false });

    await service.deactivate('1');

    expect(prisma.school.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { isActive: false },
    });
  });
});
