import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { buildPaginatedResult, containsInsensitive, ensureFound, paginationParams } from '../common/prisma/query.utils';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { SearchSchoolDto } from './dto/search-school.dto';
import { SearchSchoolAdminDto } from './dto/search-school-admin.dto';

/** Plafond du dropdown public : une recherche qui matche encore beaucoup
 * d'écoles n'a pas besoin d'en renvoyer plus — l'utilisateur affine en tapant. */
const PUBLIC_SEARCH_DEFAULT_LIMIT = 2000;
const ADMIN_LIST_DEFAULT_LIMIT = 2000;

@Injectable()
export class SchoolsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) { }

  /**
 * Retourne la liste des villes ayant au moins une école active.
 */
  async findCities() {
    const cities = await this.prisma.school.findMany({
      where: {
        isActive: true,
      },
      distinct: ['city'],
      select: {
        city: true,
      },
      orderBy: {
        city: 'asc',
      },
    });

    return cities.map((c) => c.city);
  }

  /**
   * Public search used by the visitor landing page ("choisir une école").
   * Only returns active schools; free-text match on name or city. Toujours
   * plafonné (voir PUBLIC_SEARCH_DEFAULT_LIMIT) : ce endpoint alimente un
   * dropdown de recherche, jamais un listing complet.
   */
  async searchPublic(query: SearchSchoolDto) {
    const { skip, take } = paginationParams(query.page, query.limit, PUBLIC_SEARCH_DEFAULT_LIMIT);
    const where: Prisma.SchoolWhereInput = {
      isActive: true,
    };

    // Filtre par ville

    if (query.city) {
      where.city = containsInsensitive(query.city);
    }

    // Recherche uniquement dans le nom de l'école
    if (query.search) {
      where.name = containsInsensitive(query.search);
    }
    return this.prisma.school.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
      skip,
      take,

      include: {
        schoolLists: {
          select: {
            grade: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Listing paginé pour le back-office (Admin/SuperAdmin), inclut les écoles
   * inactives. Filtrable par nom/ville — indispensable dès que la table
   * dépasse quelques dizaines d'entrées.
   */
  async findAllForAdmin(query: SearchSchoolAdminDto) {
    const { skip, take, page, limit } = paginationParams(query.page, query.limit, ADMIN_LIST_DEFAULT_LIMIT);
    const where: Prisma.SchoolWhereInput = query.search
      ? {
        OR: [
          { name: containsInsensitive(query.search) },
          { city: containsInsensitive(query.search) },
        ],
      }
      : {};
    const [data, total] = await Promise.all([
      this.prisma.school.findMany({ where, orderBy: { name: 'asc' }, skip, take }),
      this.prisma.school.count({ where }),
    ]);
    return buildPaginatedResult(data, total, page, limit);
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
  async findGrades(id: string) {
    return this.prisma.grade.findMany({
      where: {
        schoolGrades: {
          some: {
            schoolId: id,
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });
  }
  async setGrades(id: string, gradeIds: string[]) {
    await this.findOne(id);

    await this.prisma.$transaction(async (tx) => {
      // Supprime les anciennes associations
      await tx.schoolGrade.deleteMany({
        where: {
          schoolId: id,
        },
      });

      // Crée les nouvelles
      if (gradeIds.length > 0) {
        await tx.schoolGrade.createMany({
          data: gradeIds.map((gradeId) => ({
            schoolId: id,
            gradeId,
          })),
          skipDuplicates: true,
        });
      }
    });

    return this.findGrades(id);
  }
}
