import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SearchNotificationDto } from './dto/search-notification.dto';

const DEFAULT_LIMIT = 50;

export interface NotifyInput {
  userId: string;
  title: string;
  message: string;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Notifications in-app pour les utilisateurs du back-office (Commercial,
 * Admin, SuperAdmin). Les autres modules appellent `notify()` pour prévenir
 * un utilisateur (ex: changement de statut d'une commande, assignation).
 *
 * NOTE : l'envoi par canal externe (email/SMS — ex: code d'invitation
 * commercial) nécessite un fournisseur non branché ici ; ce module couvre
 * la file de notifications interne consultable une fois authentifié.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crée une notification. Tolérant aux erreurs : une notification est un
   * effet secondaire, son échec ne doit jamais faire échouer l'action métier
   * qui l'a déclenchée.
   */
  async notify(input: NotifyInput): Promise<void> {
    try {
      await this.prisma.notification.create({
        data: {
          userId: input.userId,
          title: input.title,
          message: input.message,
          metadata: input.metadata,
        },
      });
    } catch (error) {
      this.logger.error(
        `Échec de création de notification pour ${input.userId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /** Notifications de l'utilisateur courant (plus récentes d'abord). */
  findForUser(userId: string, query: SearchNotificationDto) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        ...(query.unreadOnly ? { isRead: false } : {}),
      },
      take: query.limit ?? DEFAULT_LIMIT,
      orderBy: { createdAt: 'desc' },
    });
  }

  unreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, isRead: false } });
  }

  /** Marque une notification comme lue — uniquement si elle appartient à l'utilisateur. */
  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification introuvable.');
    }
    return this.prisma.notification.update({ where: { id }, data: { isRead: true } });
  }

  async markAllAsRead(userId: string) {
    const { count } = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { updated: count };
  }
}
