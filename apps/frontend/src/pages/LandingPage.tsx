import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchGrades, fetchSchools } from '../lib/queries';
import { Button } from '../components/ui';
import InfiniteimagescrollSchool from '../components/InfiniteimagescrollSchool';
import InfiniteimagescrollSupplies from '../components/InfiniteimagescrollSupplies';
import CtaButtons from '../components/CTA';

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
    <section className="pt-0 pb-6 sm:pb-10 px-4 sm:px-6 lg:px-0">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
        {/* LEFT */}
        <div className="order-2 lg:order-1">
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
            <select
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              className="h-12 sm:h-14 w-full md:flex-1 rounded-xl border border-gray-300 px-4"
              required
            >
              <option value="">Choisissez une école</option>
              {schools.data?.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}{school.city ? ` - ${school.city}` : ""}
                </option>
              ))}
            </select>

            <select
              value={gradeId}
              onChange={(e) => setGradeId(e.target.value)}
              className="h-12 sm:h-14 w-full md:flex-1 rounded-xl border border-gray-300 px-4"
              required
            >
              <option value="">Choisissez un niveau</option>
              {grades.data?.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.name}
                </option>
              ))}
            </select>

            <Button className="w-full md:w-auto shrink-0">Voir la liste</Button>
          </form>
        </div>

        {/* RIGHT */}
        <div className="order-1 lg:order-2 flex justify-center lg:justify-end w-full">
          <img
            src="../../hero1.png"
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
        images={[
          { src: "../../logo-ecole-al-jabr.png", alt: "Ecole Al Jaber" },
          { src: "../../logo-ecole-al-madina.png", alt: "Ecole AL Madina" },
          { src: "./public/logo-ecole-al-IRfane.png", alt: "Ecole Al IRfane" },
          { src: "./public/logo-ecole-alqalam.png", alt: "Ecole Alqalam" },
          { src: "./public/elCartable.png", alt: "Stylos" },
        ]}
        durationSeconds={25}
      />
      <CtaButtons primaryLabel="Chercher votre école ici ->"/>
      <h1 className="mb-4  text-center pt-15 sm:mb-6 text-3xl text-accent-900">
        Les fournitures scolaires :
      </h1>
      <InfiniteimagescrollSupplies
        images={[
          { src: "./public/trousse-rouge.png", alt: "trousse-rouge" },
          { src: "../../bleu-pen.png", alt: "stylo-bleu" },
          { src: "../../مرشدي في اللغة العربية جذع مشترك علمي.jpg", alt: "مرشدي في اللغة العربية جذع مشترك علمي" },
          { src: "./public/trousse-beiges.png", alt: "trousse-beiges" },
          { src: "./public/منار التربية الاسلامية.png", alt: "منار التربية الاسلامية" },
        ]}
        durationSeconds={15}
      />
       <CtaButtons primaryLabel="Commencez vos achats ->"/>
    </section>

  );
}