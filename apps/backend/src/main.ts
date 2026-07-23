import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: false });
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  const apiPrefix = config.get<string>('apiPrefix', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // En production, les fichiers sont stockés sur Cloudflare R2 et servis depuis
  // R2_PUBLIC_URL — rien n'est servi depuis le disque. Le service /uploads
  // n'est monté qu'en repli local (R2 non configuré), pour le développement.
  const r2Configured = Boolean(
    config.get<string>('storage.r2.accountId') &&
      config.get<string>('storage.r2.accessKeyId') &&
      config.get<string>('storage.r2.secretAccessKey') &&
      config.get<string>('storage.r2.bucket'),
  );
  if (!r2Configured) {
    const uploadsDir = config.get<string>('uploads.dir', './uploads');
    app.useStaticAssets(join(process.cwd(), uploadsDir), { prefix: '/uploads' });
  }
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.enableCors({
    origin: config.get<string>('frontendUrl'),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips unknown properties from DTOs
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // La documentation Swagger expose toute la surface de l'API : on ne la
  // publie pas en production pour éviter la fuite d'informations.
  const swaggerEnabled = config.get<string>('env') !== 'production';
  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('elCartable API')
      .setDescription('API REST de la plateforme elCartable — fournitures scolaires à la demande')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  const port = config.get<number>('port', 3000);
  await app.listen(port);
  logger.log(`elCartable API démarrée sur http://localhost:${port}/${apiPrefix}`);
  if (swaggerEnabled) {
    logger.log(`Documentation Swagger disponible sur http://localhost:${port}/docs`);
  }
}

bootstrap().catch((error) => {
  // Sans ce handler, un échec de démarrage (connexion DB, port occupé,
  // config invalide) produit une "unhandled promise rejection" silencieuse :
  // le process peut rester en vie sans serveur et sans code de sortie clair.
  Logger.error(
    "Échec du démarrage de l'application elCartable.",
    error instanceof Error ? error.stack : String(error),
    'Bootstrap',
  );
  process.exit(1);
});
