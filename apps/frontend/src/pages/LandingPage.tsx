import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, GraduationCap } from 'lucide-react';
import { fetchGrades, fetchSchools, fetchProducts } from '../lib/queries';
import { Button } from '../components/ui';
import { SearchableSelect } from '../components/SearchableSelect';
import InfiniteimagescrollSchool from '../components/InfiniteimagescrollSchool';
import InfiniteimagescrollSupplies from '../components/InfiniteimagescrollSupplies';
import CtaButtons from '../components/CTA';

export function LandingPage() {
  const navigate = useNavigate();
  const [schoolId, setSchoolId] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [schoolSearch, setSchoolSearch] = useState('');

  // Carrousel décoratif : un échantillon suffit, pas besoin de charger toutes les écoles.
  const CAROUSEL_LIMIT = 100;
  const schools = useQuery({
    queryKey: ['schools', 'carousel'],
    queryFn: () => fetchSchools(undefined, CAROUSEL_LIMIT),
  });
  // Dropdown "choisissez une école" : recherche plafonnée côté serveur (20 résultats).
  const schoolResults = useQuery({
    queryKey: ['schools', schoolSearch],
    queryFn: () => fetchSchools(schoolSearch || undefined),
    placeholderData: (previous) => previous,
  });
  const grades = useQuery({ queryKey: ['grades'], queryFn: fetchGrades });
  const products = useQuery({ queryKey: ['products'], queryFn: () => fetchProducts() });

  // Uniquement les écoles/produits qui ont bien une image à afficher dans la galerie
  const schoolImages = (schools.data ?? [])
    .filter((school) => !!school.logoUrl)
    .map((school) => ({ src: school.logoUrl as string, alt: school.name }));

  const productImages = (products.data ?? [])
    .filter((product) => !!product.imageUrl)
    .map((product) => ({ src: product.imageUrl as string, alt: product.name }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (schoolId && gradeId) navigate(`/listes?schoolId=${schoolId}&gradeId=${gradeId}`);
  };

  return (
    <section className="pt-0 pb-6 sm:pb-10 px-4 sm:px-6 lg:px-0">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
        {/* LEFT */}
        <div className="order-1 lg:order-1">
          {/* logo */}
          <div className="mb-6 sm:mb-8 overflow-hidden rounded-2xl">
            <img
              src="../../elCartable.png"
              alt=""
              className="h-28 sm:h-36 lg:h-44 w-full object-cover"
            />
          </div>

          {/* Titre */}
          <h1 className="mb-4 sm:mb-6 text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-brand-900">
            Choisissez l'école, on s'occupe du reste.
            <br />
            <span className="text-brand-500">
              دخول مدرسي بلا ما تمحن
            </span>
          </h1>

          {/* Description */}
          <p className="mb-6 sm:mb-10 max-w-xl text-base sm:text-lg text-brand-600">
            Sélectionnez simplement l'école de votre enfant, choisissez son niveau
            scolaire et nous préparons automatiquement la liste officielle avec
            livraison partout au Maroc.
          </p>

          {/* Formulaire */}
          <form onSubmit={submit} className="flex flex-col gap-3 sm:gap-4 md:flex-row">
            <SearchableSelect
              className="md:flex-1"
              value={schoolId}
              onChange={setSchoolId}
              onSearch={setSchoolSearch}
              loading={schoolResults.isLoading}
              options={(schoolResults.data ?? []).map((school) => ({
                id: school.id,
                label: school.name,
                subtitle: school.city ?? undefined,
                iconUrl: school.logoUrl,
              }))}
              placeholder="Choisissez une école"
              searchPlaceholder="Rechercher une école..."
              emptyLabel="Aucune école trouvée"
              icon={<Building2 size={18} />}
              required
              name="schoolId"
            />

            <SearchableSelect
              className="md:flex-1"
              value={gradeId}
              onChange={setGradeId}
              options={(grades.data ?? []).map((grade) => ({ id: grade.id, label: grade.name }))}
              placeholder="Choisissez un niveau"
              searchPlaceholder="Rechercher un niveau..."
              emptyLabel="Aucun niveau trouvé"
              icon={<GraduationCap size={18} />}
              required
              name="gradeId"
            />

            <Button className="w-full md:w-auto shrink-0">Voir la liste</Button>
          </form>
        </div>

        {/* RIGHT */}
        <div className="hidden lg:flex lg:order-2 justify-center lg:justify-end w-full">
          <img
            src="../../hero-desktop-1.png"
            alt="Hero"
            className="w-full max-w-[280px] sm:max-w-[400px] lg:max-w-none lg:max-h-[700px] h-auto object-contain"
          />
        </div>
      </div>
      {/* Titre */}
      <h1 className="mb-4  text-center pt-15 sm:mb-6 text-3xl text-accent-000">
        Les écoles :
      </h1>
      <InfiniteimagescrollSchool
        images={schoolImages}
        durationSeconds={25}
      />
      <CtaButtons primaryLabel="Chercher votre école ici ->" />
      <h1 className="mb-4  text-center pt-15 sm:mb-6 text-3xl text-accent-900">
        Les fournitures scolaires :
      </h1>
      <InfiniteimagescrollSupplies
        images={productImages}
        durationSeconds={15}
      />
      <CtaButtons primaryLabel="Commencez vos achats ->" />
    </section>

  );
}