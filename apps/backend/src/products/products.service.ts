import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { containsInsensitive, ensureFound } from '../common/prisma/query.utils';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SearchProductDto } from './dto/search-product.dto';
import { UpdateStockDto } from './dto/update-stock.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  /** Public catalog browsing — used when the visitor adds extra items to a list. */
  async searchPublic(query: SearchProductDto) {
    return this.prisma.product.findMany({
      where: {
        isActive: true,
        ...(query.categoryId ? { categoryId: query.categoryId } : {}),
        ...(query.search ? { name: containsInsensitive(query.search) } : {}),
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
    return ensureFound(product, 'Produit introuvable.');
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

  /** Upload/replace de l'image produit — stockée sur R2, seule l'URL en base. */
  async setImage(id: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier reçu.');
    }
    const product = await this.findOne(id);
    const stored = await this.storage.upload({
      buffer: file.buffer,
      folder: 'products',
      originalName: file.originalname,
      mimeType: file.mimetype,
    });
    if (product.imageUrl) await this.storage.remove(product.imageUrl);
    return this.prisma.product.update({ where: { id }, data: { imageUrl: stored.url } });
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
