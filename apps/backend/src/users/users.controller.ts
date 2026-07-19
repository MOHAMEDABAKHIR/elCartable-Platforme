import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UsersService } from './users.service';
import { SearchUserDto } from './dto/search-user.dto';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({
    summary:
      'Liste des comptes back-office (Admin ne voit que les Commerciaux ; Super Admin voit Admins + Commerciaux)',
  })
  findAll(@Query() query: SearchUserDto, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.usersService.findAll(query, currentUser);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'un compte back-office" })
  findOne(@Param('id') id: string, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.usersService.findOne(id, currentUser);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Désactiver un compte (Commercial ou Admin selon le rôle appelant)' })
  deactivate(@Param('id') id: string, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.usersService.deactivate(id, currentUser);
  }

  @Patch(':id/reactivate')
  @ApiOperation({ summary: 'Réactiver un compte désactivé' })
  reactivate(@Param('id') id: string, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.usersService.reactivate(id, currentUser);
  }
}
