import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';

/**
 * Module global : le StorageService est injectable partout (uploads, produits,
 * écoles, utilisateurs, PDF) sans réimport.
 */
@Global()
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
