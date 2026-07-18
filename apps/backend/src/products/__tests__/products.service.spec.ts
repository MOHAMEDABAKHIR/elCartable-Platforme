import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from '../products.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: { product: Record<string, jest.Mock> };

  beforeEach(async () => {
    prisma = {
      product: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [ProductsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(ProductsService);
  });

  it('searchPublic only returns active products', async () => {
    prisma.product.findMany.mockResolvedValue([]);
    await service.searchPublic({});

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ isActive: true }) }),
    );
  });

  it('findOne throws NotFoundException when missing', async () => {
    prisma.product.findUnique.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
  });

  it('updateStock sets the absolute stock value', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: '1' });
    prisma.product.update.mockResolvedValue({ id: '1', stock: 42 });

    await service.updateStock('1', { stock: 42 });

    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { stock: 42 },
    });
  });

  it('deactivate sets isActive to false rather than deleting', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: '1', isActive: true });
    prisma.product.update.mockResolvedValue({ id: '1', isActive: false });

    await service.deactivate('1');

    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { isActive: false },
    });
  });
});
