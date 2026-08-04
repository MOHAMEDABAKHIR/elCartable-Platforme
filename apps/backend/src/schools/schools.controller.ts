import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IMAGE_UPLOAD_OPTIONS } from '../storage/file-upload';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { SchoolsService } from './schools.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { SearchSchoolDto } from './dto/search-school.dto';
import { SearchSchoolAdminDto } from './dto/search-school-admin.dto';
import { SetSchoolGradesDto } from './dto/set-school-grades.dto';

@ApiTags('Schools')
@Controller('schools')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) { }

  @Get()
  @ApiOperation({ summary: 'Recherche publique d’écoles (visiteur, sans authentification)' })
  searchPublic(@Query() query: SearchSchoolDto) {
    return this.schoolsService.searchPublic(query);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Liste paginée des écoles (Admin, y compris inactives)' })
  findAllForAdmin(@Query() query: SearchSchoolAdminDto) {
    return this.schoolsService.findAllForAdmin(query);
  }
  @Get('cities')
  @ApiOperation({ summary: 'Liste des villes contenant au moins une école' })
  findCities() {
    return this.schoolsService.findCities();
  }
  @Get(':id/grades')
  @ApiOperation({
    summary: "Niveaux disponibles d'une école",
  })
  findGrades(@Param('id') id: string) {
    return this.schoolsService.findGrades(id);
  }

  @Post(':id/grades')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Associer les niveaux à une école",
  })
  setGrades(
    @Param('id') id: string,
    @Body() dto: SetSchoolGradesDto,
  ) {
    return this.schoolsService.setGrades(id, dto.gradeIds);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’une école' })
  findOne(@Param('id') id: string) {
    return this.schoolsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer une école (Admin)' })
  create(@Body() dto: CreateSchoolDto) {
    return this.schoolsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier une école (Admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateSchoolDto) {
    return this.schoolsService.update(id, dto);
  }

  @Post(':id/logo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: "Uploader le logo d'une école (Admin) — image → Cloudflare R2" })
  @UseInterceptors(FileInterceptor('file', IMAGE_UPLOAD_OPTIONS))
  setLogo(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.schoolsService.setLogo(id, file);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Désactiver une école (Admin) — soft delete' })
  deactivate(@Param('id') id: string) {
    return this.schoolsService.deactivate(id);
  }
}
