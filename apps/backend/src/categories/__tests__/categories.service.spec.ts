import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CategoriesService } from '../categories.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: { category: Record<string, jest.Mock> };

  beforeEach(async () => {
    prisma = {
      category: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [CategoriesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(CategoriesService);
  });

  it('findOne throws NotFoundException when missing', async () => {
    prisma.category.findUnique.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
  });

  it('update rejects a category being set as its own parent', async () => {
    prisma.category.findUnique.mockResolvedValue({ id: '1' });
    await expect(service.update('1', { parentId: '1' })).rejects.toThrow(BadRequestException);
  });

  it('remove rejects deletion when category still has children or products', async () => {
    prisma.category.findUnique.mockResolvedValue({
      id: '1',
      children: [{ id: '2' }],
      products: [],
    });
    await expect(service.remove('1')).rejects.toThrow(BadRequestException);
  });

  it('remove deletes an empty category', async () => {
    prisma.category.findUnique.mockResolvedValue({ id: '1', children: [], products: [] });
    prisma.category.delete.mockResolvedValue({ id: '1' });

    await service.remove('1');

    expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id: '1' } });
  });
});
