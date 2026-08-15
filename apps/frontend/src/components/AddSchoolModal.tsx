import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Building2, MapPin } from 'lucide-react';
import { Button } from './ui';
import { SearchableSelect } from './SearchableSelect';
import { MOROCCO_CITIES } from '../lib/moroccoCities'; // ⚠️ à créer si elle n'existe pas encore
import { track } from '../lib/analytics';

interface AddSchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSearch?: string;
}

export function AddSchoolModal({ isOpen, onClose, defaultSearch }: AddSchoolModalProps) {
  const navigate = useNavigate();
  const [name, setName] = useState(defaultSearch ?? '');
  const [region, setRegion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !region) return;

    setIsSubmitting(true);
    track('CLICK', {
      action: 'submit_add_school',
      schoolName: name,
      region,
    });

    try {
      // TODO: brancher sur le vrai endpoint, ex: await createSchoolRequest({ name, region });
      onClose();
      navigate('/listes');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-brand-900">Ajouter votre école</h2>
          <button onClick={onClose} className="text-brand-400 hover:text-brand-600" aria-label="Fermer">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-700">
              Nom de l'école
            </label>
            <div className="relative">
              <Building2
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-400"
              />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Groupe Scolaire Al Massira"
                className="w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-700">
              Région
            </label>
            <SearchableSelect
              value={region}
              onChange={setRegion}
              options={MOROCCO_CITIES.map((r) => ({ id: r, label: r }))}
              placeholder="Choisissez la région"
              searchPlaceholder="Rechercher une région..."
              emptyLabel="Aucune région trouvée"
              icon={<MapPin size={18} />}
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={onClose}
              className="w-full border bg-white text-brand-700 hover:bg-brand-50"
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim() || !region} className="w-full">
              {isSubmitting ? 'Envoi...' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}