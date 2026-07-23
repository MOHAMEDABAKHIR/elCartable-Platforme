import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { apiErrorMessage } from '../lib/api';

/**
 * Bouton d'upload d'image réutilisable (image produit, logo école, avatar).
 * Le fichier part vers l'endpoint dédié (stockage R2 côté serveur) ; seul l'URL
 * renvoyée est ensuite persistée. Aucune clé R2 n'est exposée ici.
 */
export function ImageUploadButton({
  onUpload,
  onError,
  label = 'Image',
}: {
  onUpload: (file: File) => Promise<unknown>;
  onError?: (message: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      await onUpload(file);
    } catch (err) {
      onError?.(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-800 disabled:opacity-60"
      >
        <Upload className="h-4 w-4" />
        {busy ? 'Envoi…' : label}
      </button>
    </>
  );
}
