import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';

/**
 * @Global : AuditService est un service transverse injecté par de nombreux
 * modules (Auth, Orders, PDF...) pour tracer leurs actions sans avoir à
 * réimporter AuditModule partout — même logique que PrismaModule.
 */
@Global()
@Module({
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
