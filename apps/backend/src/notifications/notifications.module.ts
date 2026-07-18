import { Global, Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

/**
 * @Global : NotificationsService est injecté par d'autres modules (Orders...)
 * pour prévenir un utilisateur sans réimport — même logique que PrismaModule.
 */
@Global()
@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
