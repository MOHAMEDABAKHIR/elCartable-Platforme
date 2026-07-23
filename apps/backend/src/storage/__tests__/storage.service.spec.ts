import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { StorageService } from '../storage.service';

jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue(undefined),
    unlink: jest.fn().mockResolvedValue(undefined),
  },
}));

/**
 * Couvre le repli disque local (R2 non configuré) : nommage UUID, rangement par
 * dossier, et conversion URL -> clé lors de la suppression.
 */
describe('StorageService (repli local)', () => {
  const config = {
    get: jest.fn((key: string, fallback?: unknown) => {
      if (key === 'uploads.dir') return './uploads';
      return fallback; // aucune variable R2 -> repli local
    }),
  } as unknown as ConfigService;

  const service = new StorageService(config);

  beforeEach(() => jest.clearAllMocks());

  it('n’active pas le stockage distant sans configuration R2', () => {
    expect(service.isRemote()).toBe(false);
  });

  it('génère une clé UUID rangée dans le dossier demandé et une URL /uploads', async () => {
    const result = await service.upload({
      buffer: Buffer.from('x'),
      folder: 'products',
      mimeType: 'image/png',
    });

    expect(result.key).toMatch(/^products\/[0-9a-f-]{36}\.png$/);
    expect(result.url).toBe(`/uploads/${result.key}`);
    expect(fs.writeFile).toHaveBeenCalledTimes(1);
  });

  it('respecte un baseName explicite (PDF de commande idempotent)', async () => {
    const result = await service.upload({
      buffer: Buffer.from('x'),
      folder: 'orders',
      baseName: 'ELC-2026-000123',
      mimeType: 'application/pdf',
    });

    expect(result.key).toBe('orders/ELC-2026-000123.pdf');
  });

  it('supprime via une URL locale en la convertissant en clé', async () => {
    await service.remove('/uploads/products/abc.png');
    expect(fs.unlink).toHaveBeenCalledWith(expect.stringContaining('uploads/products/abc.png'));
  });

  it('ignore une suppression sans valeur', async () => {
    await service.remove(null);
    expect(fs.unlink).not.toHaveBeenCalled();
  });
});
