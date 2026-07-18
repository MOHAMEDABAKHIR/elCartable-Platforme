import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchGrades, fetchSchools } from '../lib/queries';
import { Button, Card, Field, Select, Spinner } from '../components/ui';

const STEPS = [
  { title: '1. Trouvez votre école', text: "Sélectionnez l'école et le niveau de votre enfant." },
  { title: '2. Validez la liste', text: 'La liste officielle est pré-remplie — ajustez les quantités.' },
  { title: '3. Livraison à domicile', text: 'Paiement à la livraison, partout au Maroc.' },
];

export function LandingPage() {
  const navigate = useNavigate();
  const [schoolId, setSchoolId] = useState('');
  const [gradeId, setGradeId] = useState('');

  const schools = useQuery({ queryKey: ['schools'], queryFn: () => fetchSchools() });
  const grades = useQuery({ queryKey: ['grades'], queryFn: fetchGrades });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (schoolId && gradeId) navigate(`/listes?schoolId=${schoolId}&gradeId=${gradeId}`);
  };

  return (
    <div className="space-y-16">
      <section className="grid items-center gap-8 md:grid-cols-2">
        <div className="space-y-5">
          <span className="inline-flex rounded-full bg-accent-300/40 px-3 py-1 text-sm font-semibold text-accent-500">
            Rentrée sereine, zéro file d'attente
          </span>
          <h1 className="text-4xl font-extrabold leading-tight text-brand-900 md:text-5xl">
            Les fournitures scolaires de votre enfant, <span className="text-brand-500">livrées chez vous</span>.
          </h1>
          <p className="text-lg text-brand-600">
            Choisissez l'école et le niveau, on s'occupe du reste. Sans compte, paiement à la livraison.
          </p>
          <div className="flex gap-3">
            <Link to="/catalogue">
              <Button variant="accent">Parcourir le catalogue</Button>
            </Link>
            <Link to="/suivi">
              <Button variant="outline">Suivre ma commande</Button>
            </Link>
          </div>
        </div>

        <Card className="bg-white">
          <h2 className="text-lg font-bold text-brand-800">Commander la liste de mon école</h2>
          <form onSubmit={submit} className="mt-4 space-y-4">
            <Field label="École">
              {schools.isLoading ? (
                <Spinner />
              ) : (
                <Select value={schoolId} onChange={(e) => setSchoolId(e.target.value)} required>
                  <option value="">Sélectionnez une école…</option>
                  {schools.data?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                      {s.city ? ` — ${s.city}` : ''}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Niveau">
              <Select value={gradeId} onChange={(e) => setGradeId(e.target.value)} required>
                <option value="">Sélectionnez un niveau…</option>
                {grades.data?.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Button type="submit" className="w-full" disabled={!schoolId || !gradeId}>
              Voir la liste
            </Button>
            <p className="text-center text-xs text-brand-500">
              Votre école n'est pas listée ?{' '}
              <Link to="/listes" className="font-semibold text-brand-600 underline">
                Envoyez votre liste
              </Link>
            </p>
          </form>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {STEPS.map((step) => (
          <Card key={step.title}>
            <h3 className="font-bold text-brand-800">{step.title}</h3>
            <p className="mt-2 text-sm text-brand-600">{step.text}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}
