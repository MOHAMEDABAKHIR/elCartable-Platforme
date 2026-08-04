import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, MapPin, ArrowRight } from 'lucide-react';

import { fetchSchools } from '../lib/queries';
import { Button } from '../components/ui';

export function SchoolsByCityPage() {
  const navigate = useNavigate();
  const { city } = useParams<{ city: string }>();

  const schoolsQuery = useQuery({
    queryKey: ['schools', city],
    queryFn: () => fetchSchools({ city }),
    enabled: !!city,
  });

  const schools = schoolsQuery.data ?? [];

  return (
    <section className="container mx-auto px-4 py-10">

      {/* Header */}

      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-brand-900">
          Les écoles de {city}
        </h1>

        <p className="mt-3 text-brand-600 text-lg">
          Choisissez l'école de votre enfant pour accéder aux listes officielles.
        </p>
      </div>

      {/* Loading */}

      {schoolsQuery.isLoading && (
        <div className="py-20 text-center text-brand-600">
          Chargement des écoles...
        </div>
      )}

      {/* Aucune école */}

      {!schoolsQuery.isLoading && schools.length === 0 && (
        <div className="rounded-2xl border bg-white p-10 text-center">
          <Building2
            className="mx-auto mb-4 text-brand-300"
            size={60}
          />

          <h2 className="text-2xl font-bold text-brand-900">
            Aucune école trouvée
          </h2>

          <p className="mt-2 text-brand-600">
            Nous n'avons encore aucune école enregistrée dans cette ville.
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

                  <Building2
                    size={40}
                    className="text-brand-500"
                  />

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

              <span>{school.address}</span>

            </div>

            {/* Bouton */}

            <Button
              className="mt-6 w-full"
              onClick={() =>
                navigate(`/ecoles/${school.id}`)
              }
            >

              Voir les niveaux

              <ArrowRight
                size={18}
                className="ml-2"
              />

            </Button>

          </div>

        ))}

      </div>

    </section>
  );
}