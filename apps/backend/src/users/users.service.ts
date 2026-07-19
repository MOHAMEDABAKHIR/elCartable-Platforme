import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SearchUserDto } from './dto/search-user.dto';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

const SELECT_SAFE_FIELDS = {
  id: true,
  email: true,
  fullName: true,
  phone: true,
  role: true,
  isActive: true,
  mustSetPassword: true,
  lastLoginAt: true,
  createdAt: true,
  createdById: true,
} satisfies Prisma.UserSelect;

/**
 * Gestion des comptes Commercial/Admin, dérivée du flux d'invitation
 * (module Auth). Jamais de mot de passe/token d'invitation dans les
 * réponses (SELECT_SAFE_FIELDS) — le compte SUPER_ADMIN n'est jamais
 * exposé ici, quel que soit l'appelant.
 *
 * Règle d'autorisation, appliquée en plus du @Roles() de niveau
 * contrôleur (Admin/SuperAdmin) :
 * - Admin  : ne voit et ne gère que les COMMERCIAL.
 * - SuperAdmin : voit et gère les ADMIN et les COMMERCIAL.
 */
@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private manageableRoles(currentUser: AuthenticatedUser): UserRole[] {
    return currentUser.role === UserRole.SUPER_ADMIN
      ? [UserRole.ADMIN, UserRole.COMMERCIAL]
      : [UserRole.COMMERCIAL];
  }

  async findAll(query: SearchUserDto, currentUser: AuthenticatedUser) {
    const allowedRoles = this.manageableRoles(currentUser);

    if (query.role && !allowedRoles.includes(query.role)) {
      throw new ForbiddenException(
        "Vous n'avez pas les droits pour consulter ce type de compte.",
      );
    }

    return this.prisma.user.findMany({
      where: {
        role: { in: query.role ? [query.role] : allowedRoles },
        ...(query.search
          ? {
              OR: [
                { fullName: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: SELECT_SAFE_FIELDS,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, currentUser: AuthenticatedUser) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: SELECT_SAFE_FIELDS });

    if (!user || !this.manageableRoles(currentUser).includes(user.role)) {
      // 404 rather than 403 when out of scope: don't reveal that an
      // out-of-scope account (e.g. another Admin, seen by a plain Admin)
      // exists at all.
      throw new NotFoundException('Utilisateur introuvable.');
    }

    return user;
  }

  async deactivate(id: string, currentUser: AuthenticatedUser) {
    if (id === currentUser.id) {
      throw new BadRequestException('Vous ne pouvez pas désactiver votre propre compte.');
    }

    await this.findOne(id, currentUser); // 404/scope check

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: SELECT_SAFE_FIELDS,
    });

    await this.auditService.log({
      action: AuditAction.UPDATE,
      userId: currentUser.id,
      entityType: 'User',
      entityId: id,
      metadata: { change: 'deactivated', targetRole: updated.role },
    });

    return updated;
  }

  async reactivate(id: string, currentUser: AuthenticatedUser) {
    await this.findOne(id, currentUser); // 404/scope check

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: SELECT_SAFE_FIELDS,
    });

    await this.auditService.log({
      action: AuditAction.UPDATE,
      userId: currentUser.id,
      entityType: 'User',
      entityId: id,
      metadata: { change: 'reactivated', targetRole: updated.role },
    });

    return updated;
  }
}
