import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';

@Injectable()
export class GradesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Public listing used right after a visitor picks a school. */
  async findAllPublic() {
    return this.prisma.grade.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
  }

  async findAllForAdmin() {
    return this.prisma.grade.findMany({ orderBy: { order: 'asc' } });
  }

  async findOne(id: string) {
    const grade = await this.prisma.grade.findUnique({ where: { id } });
    if (!grade) {
      throw new NotFoundException('Niveau scolaire introuvable.');
    }
    return grade;
  }

  async create(dto: CreateGradeDto) {
    return this.prisma.grade.create({ data: dto });
  }

  async update(id: string, dto: UpdateGradeDto) {
    await this.findOne(id);
    return this.prisma.grade.update({ where: { id }, data: dto });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.grade.update({ where: { id }, data: { isActive: false } });
  }
}
