import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { SchoolListsService } from './school-lists.service';
import { CreateOfficialSchoolListDto } from './dto/create-official-school-list.dto';
import { SubmitCustomSchoolListDto } from './dto/submit-custom-school-list.dto';

@ApiTags('SchoolLists')
@Controller('school-lists')
export class SchoolListsController {
  constructor(private readonly schoolListsService: SchoolListsService) {}

  @Get()
  @ApiOperation({
    summary: 'Scénario 1 : récupérer la liste officielle pour une école + un niveau (public)',
  })
  findOfficialList(@Query('schoolId') schoolId: string, @Query('gradeId') gradeId: string) {
    return this.schoolListsService.findOfficialList(schoolId, gradeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’une liste scolaire (officielle ou personnalisée)' })
  findOne(@Param('id') id: string) {
    return this.schoolListsService.findOne(id);
  }

  @Post('custom')
  @ApiOperation({
    summary:
      "Scénario 2 : soumettre une liste personnalisée (école introuvable) — photo, fichier ou saisie manuelle (public)",
  })
  submitCustomList(@Body() dto: SubmitCustomSchoolListDto) {
    return this.schoolListsService.submitCustomList(dto);
  }

  @Post('official')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer/remplacer la liste officielle d’une école + niveau (Admin)' })
  createOrReplaceOfficialList(@Body() dto: CreateOfficialSchoolListDto) {
    return this.schoolListsService.createOrReplaceOfficialList(dto);
  }
}
