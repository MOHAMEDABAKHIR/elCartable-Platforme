import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchSchools, fetchProducts } from '../lib/queries';
import { Button } from '../components/ui';
import { SearchableSelect } from '../components/SearchableSelect';
import InfiniteimagescrollSchool from '../components/InfiniteimagescrollSchool';
import InfiniteimagescrollSupplies from '../components/InfiniteimagescrollSupplies';
import CtaButtons from '../components/CTA';
import { Building2 } from 'lucide-react';
import { MOROCCO_CITIES } from '../lib/moroccoCities';
import { track } from '../lib/analytics';
import FeaturedSchoolCards from '../components/FeaturedSchoolCards';

import schoolDefaultImagel from '../../public/wizarat-tarbiya-logo.png';
import productDefaultImagel from '../../public/productDefaultImagel.avif';
import { SchoolListPhotoCta } from '../components/SchoolListPhotoCta';

export function LandingPage() {
  const navigate = useNavigate();
  const [city, setCity] = useState('');

  // Carrousel décoratif : un échantillon suffit
  const CAROUSEL_LIMIT = 100;

  const schools = useQuery({
    queryKey: ['schools', 'carousel'],
    queryFn: () =>
      fetchSchools({
        limit: CAROUSEL_LIMIT,
      }),
  });

  const products = useQuery({
    queryKey: ['products','carousel'],
    queryFn: () => fetchProducts(
      {
        limit: CAROUSEL_LIMIT,
      }
    ),
  });

  // Écoles : logo + nom associés dans le même objet
  const schoolImages = (schools.data ?? [])
    .slice() // évite de muter le cache react-query
    .sort((a, b) => {
      const aHasImage = Boolean(a.logoUrl);
      const bHasImage = Boolean(b.logoUrl);
      return Number(bHasImage) - Number(aHasImage); // true (1) avant false (0)
    }).map((school) => ({
      src: school.logoUrl || (schoolDefaultImagel as string),
      alt: school.name,
      name: school.name,
      adress: school.address,
    }));

  // Produits
  const productImages = (products.data ?? []).map((product) => ({
    src: product.imageUrl || (productDefaultImagel as string),
    alt: product.name,
    name: product.name,
  }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!city) return;

    track('CLICK', {
      action: 'view_city_schools',
      city,
    });

    navigate(`/villes/${encodeURIComponent(city)}`);
  };

  return (
    <section>
      {/* HERO */}
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

          {/* les écoles célébres qui vont attirer la tention ( CTA ) */}

          <FeaturedSchoolCards />
        </div>

        {/* RIGHT */}
        <div className="hidden lg:flex lg:order-2 justify-center lg:justify-end w-full">
          <img
            src="../../hero-desktop-1.png"
            alt="Hero"
            className="w-full max-w-[300px] sm:max-w-[500px] lg:max-w-none lg:max-h-[700px] h-auto object-contain"
          />
        </div>
      </div>
{/* FOURNITURES */}
      <h2 className="mb-4 text-center pt-15 sm:mb-6 text-3xl text-accent-900">
        Les fournitures scolaires :
      </h2>

      <InfiniteimagescrollSupplies
        images={productImages}
        durationSeconds={150}
      />
      <CtaButtons primaryLabel="Commencez vos achats →" primaryHref="/catalogue" />
      


      <SchoolListPhotoCta/>

      
{/* ÉCOLES */}
      <h2 className="mb-4 text-center pt-15 sm:mb-6 text-3xl text-accent-000">
        Les écoles :
      </h2>

      <InfiniteimagescrollSchool
        images={schoolImages}
      />

      <CtaButtons primaryLabel="Chercher votre école ici →" primaryHref="/ecoles" />
      {/* Formulaire */}
      <form onSubmit={submit} className="flex flex-col gap-3 sm:gap-4 md:flex-row mt-20">
        <SearchableSelect
          className="md:flex-1"
          value={city}
          onChange={(selectedCity) => {
            setCity(selectedCity);

            track('CLICK', {
              action: 'select_city',
              city: selectedCity,
            });
          }}
          options={MOROCCO_CITIES.map((city) => ({
            id: city,
            label: city,
          }))}
          placeholder="Choisissez votre ville"
          searchPlaceholder="Rechercher une ville..."
          emptyLabel="Aucune ville trouvée"
          icon={<Building2 size={18} />}
          required
        />

        <Button className="w-full md:w-auto shrink-0">Voire les écoles</Button>
      </form>

    </section>

  );
}