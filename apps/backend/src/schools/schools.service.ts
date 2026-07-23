import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { containsInsensitive, ensureFound } from '../common/prisma/query.utils';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { SearchSchoolDto } from './dto/search-school.dto';

@Injectable()
export class SchoolsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

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
                { name: containsInsensitive(query.search) },
                { city: containsInsensitive(query.search) },
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
    return ensureFound(school, 'École introuvable.');
  }

  async create(dto: CreateSchoolDto) {
    return this.prisma.school.create({ data: dto });
  }

  async update(id: string, dto: UpdateSchoolDto) {
    await this.findOne(id); // 404 early if missing
    return this.prisma.school.update({ where: { id }, data: dto });
  }

  /** Upload/replace du logo école — stocké sur R2, seule l'URL en base. */
  async setLogo(id: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier reçu.');
    }
    const school = await this.findOne(id);
    const stored = await this.storage.upload({
      buffer: file.buffer,
      folder: 'schools',
      originalName: file.originalname,
      mimeType: file.mimetype,
    });
    if (school.logoUrl) await this.storage.remove(school.logoUrl);
    return this.prisma.school.update({ where: { id }, data: { logoUrl: stored.url } });
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
