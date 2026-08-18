import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { track } from '../lib/analytics';

export function SchoolListPhotoCta() {
  const navigate = useNavigate();

  const goToLists = () => {
    track('CLICK', { action: 'school_list_photo_cta' });
    navigate('/listes');
  };

  return (
    <button
      type="button"
      onClick={goToLists}
      className="group relative w-full overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-6 sm:p-8 text-left shadow-sm transition hover:shadow-md hover:border-brand-300"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8">
        <div className="flex h-14 w-14 sm:h-16 sm:w-16 flex-shrink-0 items-center justify-center rounded-full bg-brand-500 text-white shadow-inner">
          <Camera size={28} />
        </div>

        <div className="flex-1">
          <h3 className="text-xl sm:text-2xl font-bold text-brand-900">
            Prenez la liste scolaire en photo
          </h3>
          <p className="mt-1 text-sm sm:text-base text-brand-700/80">
            On s'occupe de tout : envoyez-nous la photo de la liste et complétez avec vos
            produits préférés.
          </p>
        </div>

        <span className="hidden sm:inline-flex shrink-0 items-center gap-2 rounded-full bg-brand-500 px-5 py-3 font-semibold text-white transition group-hover:bg-brand-600">
          Commencer <Camera size={18} />
        </span>
      </div>

      <span className="mt-4 inline-flex sm:hidden items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 font-semibold text-white">
        Commencer <Camera size={18} />
      </span>
    </button>
  );
}