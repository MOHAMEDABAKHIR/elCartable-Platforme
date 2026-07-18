import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ensureFound } from '../common/prisma/query.utils';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Public: full tree used by the catalog / product filters. */
  async findAll() {
    return this.prisma.category.findMany({
      where: { parentId: null },
      include: { children: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { children: true },
    });
    return ensureFound(category, 'Catégorie introuvable.');
  }

  async create(dto: CreateCategoryDto) {
    if (dto.parentId) {
      await this.findOne(dto.parentId); // 404 if parent doesn't exist
    }
    return this.prisma.category.create({ data: dto });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);
    if (dto.parentId === id) {
      throw new BadRequestException('Une catégorie ne peut pas être sa propre parente.');
    }
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  /**
   * Categories are catalog metadata, not referenced by historical orders
   * (products snapshot their own label at order time), so a real delete is
   * safe here — but only when the category is empty.
   */
  async remove(id: string) {
    const found = await this.prisma.category.findUnique({
      where: { id },
      include: { children: true, products: true },
    });
    const category = ensureFound(found, 'Catégorie introuvable.');
    if (category.children.length > 0 || category.products.length > 0) {
      throw new BadRequestException(
        'Impossible de supprimer une catégorie contenant des sous-catégories ou des produits.',
      );
    }
    return this.prisma.category.delete({ where: { id } });
  }
}
