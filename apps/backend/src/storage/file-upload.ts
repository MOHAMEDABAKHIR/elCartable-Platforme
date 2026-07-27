import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';

const MAX_FILE_SIZE_BYTES =
  parseInt(process.env.UPLOAD_MAX_FILE_SIZE_MB ?? '5', 10) * 1024 * 1024;

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
const DOCUMENT_MIME_TYPES = [...IMAGE_MIME_TYPES, 'application/pdf'];

/**
 * Le fichier est gardé en mémoire (buffer) puis délégué au StorageService qui
 * l'envoie vers Cloudflare R2 — aucune écriture disque intermédiaire (hors
 * repli local) et aucun stockage en base.
 */
function buildOptions(allowed: string[]): MulterOptions {
  return {
    storage: memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
    fileFilter: (_req, file, callback) => {
      if (!allowed.includes(file.mimetype)) {
        return callback(
          new BadRequestException(`Type de fichier non autorisé (${allowed.join(', ')}).`),
          false,
        );
      }
      callback(null, true);
    },
  };
}

/** Images uniquement (produits, logos écoles, avatars). */
export const IMAGE_UPLOAD_OPTIONS = buildOptions(IMAGE_MIME_TYPES);

/** Images + PDF (liste scolaire scénario 2, justificatifs). */
export const DOCUMENT_UPLOAD_OPTIONS = buildOptions(DOCUMENT_MIME_TYPES);
