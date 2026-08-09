import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, MapPin, ArrowRight, Search } from 'lucide-react';
import { matchesSearch } from '../lib/search';

import { fetchSchools } from '../lib/queries';
import { Button, SearchBarBySchool } from '../components/ui';
import { track } from '../lib/analytics';

export function AllSchoolsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const schoolsQuery = useQuery({
    queryKey: ['schools', 'all'],
    queryFn: () => fetchSchools(),
  });

  const allSchools = schoolsQuery.data ?? [];

  const schools = search.trim()
    ? allSchools.filter(
        (school) =>
          matchesSearch(school.name, search) ||
          matchesSearch(school.address ?? '', search)
      )
    : allSchools;

  return (
    <section className="container mx-auto px-4 py-10">

      {/* Header */}

      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-brand-900">
          Toutes les écoles
        </h1>

        <p className="mt-3 text-brand-600 text-lg">
          Choisissez l'école de votre enfant pour accéder aux listes officielles.
        </p>
      </div>

      {/* Barre de recherche */}

      <SearchBarBySchool
        value={search}
        onChange={setSearch}
        placeholder="Rechercher une école par nom ou adresse..."
        className="mb-8"
      />

      {/* Loading */}

      {schoolsQuery.isLoading && (
        <div className="py-20 text-center text-brand-600">
          Chargement des écoles...
        </div>
      )}

      {/* Aucune école */}

      {!schoolsQuery.isLoading && allSchools.length === 0 && (
        <div className="rounded-2xl border bg-white p-10 text-center">
          <Building2 className="mx-auto mb-4 text-brand-300" size={60} />
          <h2 className="text-2xl font-bold text-brand-900">
            Aucune école trouvée
          </h2>

          <p className="mt-2 text-brand-600">
            Nous n'avons encore aucune école enregistrée.
          </p>
        </div>
      )}

      {/* Aucun résultat de recherche */}

      {!schoolsQuery.isLoading && allSchools.length > 0 && schools.length === 0 && (
        <div className="rounded-2xl border bg-white p-10 text-center">
          <Search className="mx-auto mb-4 text-brand-300" size={60} />
          <h2 className="text-2xl font-bold text-brand-900">
            Aucun résultat pour "{search}"
          </h2>
          <p className="mt-2 text-brand-600">
            Essayez un autre nom ou une autre adresse.
          </p>
        </div>
      )}

      {/* Liste */}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

        {schools.map((school) => (

          <div
            key={school.id}
            className="rounded-3xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >

            {/* Logo */}

            <div className="flex justify-center">

              {school.logoUrl ? (

                <img
                  src={school.logoUrl}
                  alt={school.name}
                  className="h-24 w-24 rounded-full object-cover border"
                />

              ) : (

                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-100">

                  <Building2 size={40} className="text-brand-500" />

                </div>

              )}

            </div>

            {/* Nom */}

            <h2 className="mt-5 text-center text-xl font-bold text-brand-900">
              {school.name}
            </h2>

            {/* Adresse */}

            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-brand-600">

              <MapPin size={16} />

              <span>{school.address ?? 'Adresse non renseignée'}</span>

            </div>

            {/* Bouton */}

            <Button
              className="mt-6 w-full"
              onClick={() => {
                track('CLICK', {
                  action: 'select_school',
                  schoolId: school.id,
                  schoolName: school.name,
                });

                navigate(`/ecoles/${school.id}`);
              }}
            >

              Voir les niveaux

              <ArrowRight size={18} className="ml-2" />

            </Button>

          </div>

        ))}

      </div>

    </section>
  );
}