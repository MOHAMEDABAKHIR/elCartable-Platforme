import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { promises as fs } from 'fs';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import type { StorageFolder, StoredFile, UploadFileInput } from './storage.types';

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'application/pdf': '.pdf',
};

/**
 * Service de stockage de fichiers réutilisable.
 *
 * Cible principale : Cloudflare R2 (S3-compatible). Aucun binaire n'est
 * persisté en base de données — seule l'URL publique renvoyée par ce service
 * est enregistrée dans Neon (imageUrl, logoUrl, avatarUrl, pdfUrl…).
 *
 * Si les variables R2 ne sont pas configurées, le service retombe
 * automatiquement sur le disque local (`UPLOAD_DIR`, servi sous `/uploads`),
 * ce qui permet de développer sans compte R2. Le comportement de l'API est
 * identique : un `upload()` renvoie toujours une URL exploitable.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client | null;
  private readonly bucket?: string;
  private readonly publicBaseUrl?: string;
  private readonly localDir: string;

  constructor(private readonly config: ConfigService) {
    const accountId = this.config.get<string>('storage.r2.accountId');
    const accessKeyId = this.config.get<string>('storage.r2.accessKeyId');
    const secretAccessKey = this.config.get<string>('storage.r2.secretAccessKey');
    this.bucket = this.config.get<string>('storage.r2.bucket');
    this.localDir = this.config.get<string>('uploads.dir', './uploads');

    const configured = Boolean(accountId && accessKeyId && secretAccessKey && this.bucket);

    if (configured) {
      const endpoint =
        this.config.get<string>('storage.r2.endpoint') ??
        `https://${accountId}.r2.cloudflarestorage.com`;
      this.client = new S3Client({
        region: 'auto',
        endpoint,
        credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
      });
      const publicUrl = this.config.get<string>('storage.r2.publicUrl');
      // À défaut d'URL publique dédiée, on retombe sur endpoint/bucket (nécessite
      // un bucket public) — l'URL reste néanmoins toujours définie.
      this.publicBaseUrl = (publicUrl ?? `${endpoint}/${this.bucket}`).replace(/\/+$/, '');
      this.logger.log(`Stockage Cloudflare R2 actif (bucket "${this.bucket}").`);
    } else {
      this.client = null;
      this.logger.warn(
        'Cloudflare R2 non configuré — repli sur le disque local (/uploads). Renseignez R2_* pour activer le stockage objet.',
      );
    }
  }

  /** True lorsque le stockage objet distant (R2) est actif. */
  isRemote(): boolean {
    return this.client !== null;
  }

  /**
   * Enregistre un fichier et renvoie son URL publique + sa clé objet. Génère
   * un nom unique (UUID) sauf `baseName` explicite, et range le fichier dans
   * le dossier logique demandé.
   */
  async upload(input: UploadFileInput): Promise<StoredFile> {
    const ext = this.resolveExtension(input.mimeType, input.originalName);
    const base = input.baseName ?? randomUUID();
    const key = `${input.folder}/${base}${ext}`;

    if (this.client && this.bucket) {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: input.buffer,
          ContentType: input.mimeType,
        }),
      );
      return { url: `${this.publicBaseUrl}/${key}`, key };
    }

    // Repli disque local.
    const dir = join(process.cwd(), this.localDir, input.folder);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(join(dir, `${base}${ext}`), input.buffer);
    return { url: `/uploads/${key}`, key };
  }

  /**
   * Supprime un fichier à partir de son URL ou de sa clé. Tolérant aux erreurs :
   * une suppression ratée (fichier déjà absent, réseau) est journalisée sans
   * faire échouer la requête appelante.
   */
  async remove(urlOrKey?: string | null): Promise<void> {
    if (!urlOrKey) return;
    const key = this.toKey(urlOrKey);
    if (!key) return;

    try {
      if (this.client && this.bucket) {
        await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
      } else {
        await fs.unlink(join(process.cwd(), this.localDir, key)).catch(() => undefined);
      }
    } catch (error) {
      this.logger.warn(
        `Suppression du fichier "${key}" impossible: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private resolveExtension(mimeType?: string, originalName?: string): string {
    if (mimeType && MIME_EXTENSIONS[mimeType]) return MIME_EXTENSIONS[mimeType];
    if (originalName) {
      const ext = extname(originalName).toLowerCase();
      if (ext) return ext;
    }
    return '';
  }

  /** Extrait la clé objet (`folder/name.ext`) d'une URL publique ou locale. */
  private toKey(urlOrKey: string): string | null {
    if (this.publicBaseUrl && urlOrKey.startsWith(this.publicBaseUrl)) {
      return urlOrKey.slice(this.publicBaseUrl.length + 1);
    }
    if (urlOrKey.startsWith('/uploads/')) {
      return urlOrKey.slice('/uploads/'.length);
    }
    // Déjà une clé (pas de schéma http) : on la renvoie telle quelle.
    if (!urlOrKey.includes('://') && !urlOrKey.startsWith('/')) {
      return urlOrKey;
    }
    return null;
  }
}
