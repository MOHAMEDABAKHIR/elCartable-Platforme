import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GradesService } from '../grades.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('GradesService', () => {
  let service: GradesService;
  let prisma: { grade: Record<string, jest.Mock> };

  beforeEach(async () => {
    prisma = {
      grade: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [GradesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(GradesService);
  });

  it('findAllPublic only returns active grades ordered by "order"', async () => {
    prisma.grade.findMany.mockResolvedValue([]);
    await service.findAllPublic();

    expect(prisma.grade.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
  });

  it('findOne throws NotFoundException when grade does not exist', async () => {
    prisma.grade.findUnique.mockResolvedValue(null);
    await expect(service.findOne('missing-id')).rejects.toThrow(NotFoundException);
  });
});
