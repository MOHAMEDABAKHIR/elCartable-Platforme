import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { InviteCommercialDto } from './dto/invite-commercial.dto';
import { InviteAdminDto } from './dto/invite-admin.dto';
import { AuthenticatedUser } from './types/authenticated-user.type';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Connexion email + mot de passe (Commercial / Admin / Super Admin)' })
  async login(@Body() _dto: LoginDto, @Req() req: Request) {
    // LocalAuthGuard already validated credentials and attached req.user
    return this.authService.login(req.user as AuthenticatedUser, req.ip);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Déconnexion (trace une entrée LOGOUT dans le journal d’audit)' })
  async logout(@CurrentUser() currentUser: AuthenticatedUser, @Req() req: Request) {
    return this.authService.logout(currentUser, req.ip);
  }

  @Post('invitations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Inviter un nouveau commercial (Admin ou Super Admin)' })
  async inviteCommercial(
    @Body() dto: InviteCommercialDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.authService.inviteCommercial(dto, currentUser.id);
  }

  @Post('invitations/admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Inviter un nouvel administrateur (Super Admin uniquement)' })
  async inviteAdmin(
    @Body() dto: InviteAdminDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.authService.inviteAdmin(dto, currentUser.id);
  }

  @Post('invitations/accept')
  @ApiOperation({
    summary: 'Première connexion du commercial : email + code invitation + définition du mot de passe',
  })
  async acceptInvitation(@Body() dto: AcceptInvitationDto) {
    return this.authService.acceptInvitation(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Rafraîchir l'access token" })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }
}
