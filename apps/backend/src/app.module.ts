import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SchoolsModule } from './schools/schools.module';
import { GradesModule } from './grades/grades.module';
import { SchoolListsModule } from './school-lists/school-lists.module';
import { UploadsModule } from './uploads/uploads.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { VisitorsModule } from './visitors/visitors.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuditModule } from './audit/audit.module';
import { SettingsModule } from './settings/settings.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PdfModule } from './pdf/pdf.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    SchoolsModule,
    GradesModule,
    SchoolListsModule,
    UploadsModule,
    CategoriesModule,
    ProductsModule,
    OrdersModule,
    VisitorsModule,
    AnalyticsModule,
    DashboardModule,
    AuditModule,
    SettingsModule,
    NotificationsModule,
    PdfModule,
    // Modules à venir : QrCode.
  ],
  providers: [
    // Applique le rate limiting configuré par ThrottlerModule à toutes les
    // routes (protège notamment /auth/login du brute-force et les endpoints
    // publics de l'abus).
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
