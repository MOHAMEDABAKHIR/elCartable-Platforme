import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { VisitorsService } from './visitors.service';
import { IdentifyVisitorDto } from './dto/identify-visitor.dto';
import { StartVisitorSessionDto } from './dto/start-visitor-session.dto';
import { EndVisitorSessionDto } from './dto/end-visitor-session.dto';
import { SearchVisitorDto } from './dto/search-visitor.dto';

@ApiTags('Visitors')
@Controller('visitors')
export class VisitorsController {
  constructor(private readonly visitorsService: VisitorsService) {}

  @Post('identify')
  @ApiOperation({ summary: 'Identifier/rafraîchir un visiteur anonyme (public)' })
  identify(@Body() dto: IdentifyVisitorDto, @Req() req: Request) {
    return this.visitorsService.identify(dto, req.ip);
  }

  @Post('sessions')
  @ApiOperation({ summary: 'Démarrer une session visiteur (public) — crée le visiteur si besoin' })
  startSession(@Body() dto: StartVisitorSessionDto, @Req() req: Request) {
    return this.visitorsService.startSession(dto, req.ip);
  }

  @Patch('sessions/:id/end')
  @ApiOperation({ summary: 'Terminer une session visiteur (public)' })
  endSession(@Param('id') id: string, @Body() dto: EndVisitorSessionDto) {
    return this.visitorsService.endSession(id, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Liste des visiteurs (Admin/SuperAdmin)' })
  findAll(@Query() query: SearchVisitorDto) {
    return this.visitorsService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Détail d'un visiteur et de ses sessions (Admin/SuperAdmin)" })
  findOne(@Param('id') id: string) {
    return this.visitorsService.findOne(id);
  }
}
