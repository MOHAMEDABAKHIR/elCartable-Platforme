/**
 * Dossiers logiques du bucket. Chaque type de fichier est rangé dans son
 * préfixe pour garder le stockage organisé et faciliter les politiques de
 * cycle de vie côté Cloudflare R2.
 */
export type StorageFolder = 'products' | 'schools' | 'avatars' | 'orders' | 'lists';

export interface UploadFileInput {
  buffer: Buffer;
  folder: StorageFolder;
  /** Nom d'origine (sert à déduire l'extension si le mime est inconnu). */
  originalName?: string;
  mimeType?: string;
  /**
   * Nom de base imposé (sans extension) — utile pour un fichier idempotent
   * comme un PDF de commande (`ELC-2026-000123`). Par défaut : UUID v4.
   */
  baseName?: string;
}

export interface StoredFile {
  /** URL publique à persister en base et à servir au frontend. */
  url: string;
  /** Clé objet dans le bucket (préfixe/dossier inclus), ex: `products/uuid.png`. */
  key: string;
}
