import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { SearchSchoolDto } from './dto/search-school.dto';

@Injectable()
export class SchoolsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Public search used by the visitor landing page ("choisir une école").
   * Only returns active schools; free-text match on name or city.
   */
  async searchPublic(query: SearchSchoolDto) {
    return this.prisma.school.findMany({
      where: {
        isActive: true,
        ...(query.search
          ? {
              OR: [
                { name: { contains: query.search, mode: 'insensitive' } },
                { city: { contains: query.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  /** Full listing for Admin/SuperAdmin back-office (includes inactive schools). */
  async findAllForAdmin() {
    return this.prisma.school.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const school = await this.prisma.school.findUnique({ where: { id } });
    if (!school) {
      throw new NotFoundException('École introuvable.');
    }
    return school;
  }

  async create(dto: CreateSchoolDto) {
    return this.prisma.school.create({ data: dto });
  }

  async update(id: string, dto: UpdateSchoolDto) {
    await this.findOne(id); // 404 early if missing
    return this.prisma.school.update({ where: { id }, data: dto });
  }

  /**
   * Soft delete: schools are referenced by orders and school lists, so we
   * never hard-delete — we deactivate. This keeps historical orders intact.
   */
  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.school.update({ where: { id }, data: { isActive: false } });
  }
}
