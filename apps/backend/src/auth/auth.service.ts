import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuditAction, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { InviteCommercialDto } from './dto/invite-commercial.dto';
import { InviteAdminDto } from './dto/invite-admin.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { AuthenticatedUser, JwtPayload } from './types/authenticated-user.type';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  // ==========================================================
  // LOGIN (email + password) — used by Commercial, Admin, SuperAdmin
  // ==========================================================

  async validateCredentials(email: string, password: string): Promise<AuthenticatedUser | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive || !user.password) {
      // no password set yet => commercial hasn't completed invitation flow
      return null;
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return null;
    }

    return { id: user.id, email: user.email, role: user.role, fullName: user.fullName };
  }

  async login(user: AuthenticatedUser, ipAddress?: string) {
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await this.auditService.log({
      action: AuditAction.LOGIN,
      userId: user.id,
      entityType: 'User',
      entityId: user.id,
      ipAddress,
    });

    return this.issueTokens(user);
  }

  async logout(user: AuthenticatedUser, ipAddress?: string) {
    await this.auditService.log({
      action: AuditAction.LOGOUT,
      userId: user.id,
      entityType: 'User',
      entityId: user.id,
      ipAddress,
    });

    return { success: true };
  }

  // ==========================================================
  // INVITATION FLOW (shared by Admin -> Commercial, and
  // SuperAdmin -> Admin)
  // L'utilisateur invitant crée le compte -> l'invité se connecte avec
  // email + code d'invitation -> doit définir un mot de passe -> connexion
  // normale ensuite. L'autorisation (qui a le droit d'inviter quel rôle)
  // est appliquée au niveau du contrôleur (@Roles) : SuperAdmin seul pour
  // les Admins ; Admin/SuperAdmin pour les Commerciaux.
  // ==========================================================

  async inviteCommercial(dto: InviteCommercialDto, invitedById: string) {
    return this.createInvitedUser(dto, UserRole.COMMERCIAL, invitedById);
  }

  async inviteAdmin(dto: InviteAdminDto, invitedById: string) {
    return this.createInvitedUser(dto, UserRole.ADMIN, invitedById);
  }

  private async createInvitedUser(
    dto: { email: string; fullName: string; phone?: string },
    role: UserRole,
    invitedById: string,
  ) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new BadRequestException('Un utilisateur avec cet email existe déjà.');
    }

    const invitationCode = this.generateInvitationCode();
    const expiresInHours = this.configService.get<number>('invitation.expiresInHours', 72);
    const invitationExpires = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName,
        phone: dto.phone,
        role,
        mustSetPassword: true,
        invitationCode,
        invitationExpires,
        createdById: invitedById,
      },
    });

    await this.auditService.log({
      action: AuditAction.CREATE,
      userId: invitedById,
      entityType: 'User',
      entityId: user.id,
      metadata: { role, email: user.email },
    });

    // NOTE: sending the invitation code by email/SMS is delegated to the
    // Notifications module (not yet implemented). For now it's returned
    // so the inviting Admin/SuperAdmin can transmit it manually.
    this.logger.log(`${role} invité: ${user.email} (code valable ${expiresInHours}h)`);

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      invitationCode,
      expiresAt: invitationExpires,
    };
  }

  async acceptInvitation(dto: AcceptInvitationDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (
      !user ||
      !user.mustSetPassword ||
      user.invitationCode !== dto.invitationCode ||
      !user.invitationExpires ||
      user.invitationExpires < new Date()
    ) {
      throw new UnauthorizedException("Code d'invitation invalide ou expiré.");
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        mustSetPassword: false,
        invitationCode: null,
        invitationExpires: null,
      },
    });

    const authenticatedUser: AuthenticatedUser = {
      id: updated.id,
      email: updated.email,
      role: updated.role,
      fullName: updated.fullName,
    };

    return this.issueTokens(authenticatedUser);
  }

  // ==========================================================
  // TOKENS
  // ==========================================================

  async issueTokens(user: AuthenticatedUser) {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.accessSecret'),
        expiresIn: this.configService.get<string>('jwt.accessExpiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role, fullName: user.fullName },
    };
  }

  async refresh(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token invalide ou expiré.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Compte introuvable ou désactivé.');
    }

    return this.issueTokens({
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    });
  }

  private generateInvitationCode(): string {
    return randomBytes(4).toString('hex').toUpperCase(); // e.g. "A1B2C3D4"
  }
}
