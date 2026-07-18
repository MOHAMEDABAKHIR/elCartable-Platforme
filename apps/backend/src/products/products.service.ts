import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SearchProductDto } from './dto/search-product.dto';
import { UpdateStockDto } from './dto/update-stock.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Public catalog browsing — used when the visitor adds extra items to a list. */
  async searchPublic(query: SearchProductDto) {
    return this.prisma.product.findMany({
      where: {
        isActive: true,
        ...(query.categoryId ? { categoryId: query.categoryId } : {}),
        ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}),
      },
      include: { category: true },
      orderBy: { name: 'asc' },
    });
  }

  async findAllForAdmin() {
    return this.prisma.product.findMany({
      include: { category: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) {
      throw new NotFoundException('Produit introuvable.');
    }
    return product;
  }

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({ data: dto });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  /** Dedicated endpoint so stock changes can later be audited independently of general edits. */
  async updateStock(id: string, dto: UpdateStockDto) {
    await this.findOne(id);
    return this.prisma.product.update({ where: { id }, data: { stock: dto.stock } });
  }

  /**
   * Soft delete: products are referenced by historical orders (OrderItem
   * snapshots its own label/price, but keeps productId as a link) and by
   * school list items, so we deactivate rather than hard-delete.
   */
  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.product.update({ where: { id }, data: { isActive: false } });
  }
}
