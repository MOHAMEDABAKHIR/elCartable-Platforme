import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Sparkles,
  ShoppingCart,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { track } from '../lib/analytics';

import schoolListCta from '../../public/cta-photo-list.png';

export function SchoolListPhotoCta() {
  const navigate = useNavigate();

  const goToLists = () => {
    track('CLICK', {
      action: 'school_list_photo_cta',
    });

    navigate('/listes');
  };

  return (
    <section className="w-full px-4 sm:px-6 m-12">
      <button
        type="button"
        onClick={goToLists}
        className="group relative mx-auto block w-full max-w-6xl overflow-hidden rounded-[2rem] bg-white text-left transition-all duration-300"
      >
        {/* Background decoration */}
        <div className="" />
        <div className="" />

        <div className="relative grid items-center lg:grid-cols-[1fr_0.9fr]">
          
          {/* ================= LEFT ================= */}
          <div className="p-7 sm:p-10 lg:p-12">

            {/* Badge */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3.5 py-2 text-xs font-bold uppercase tracking-wide text-brand-600">
              <Sparkles size={14} />
              Nouveau
            </div>

            {/* Title */}
            <h2 className="max-w-xl text-3xl font-extrabold leading-tight tracking-tight text-brand-950 sm:text-4xl">
              Envoyez votre liste scolaire,
              <span className="block text-brand-500">
                on s'occupe du reste.
              </span>
            </h2>

            {/* Description */}
            <p className="mt-5 max-w-xl text-base leading-7 text-brand-700/75 sm:text-lg">
              Prenez simplement une photo de votre liste scolaire.
              Nous identifions les articles et vous aidons à préparer
              votre panier en quelques secondes.
            </p>

            {/* Benefits */}
            <div className="mt-7 grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">

              <Benefit
                icon={<Sparkles size={18} />}
                title="Lecture intelligente"
                text="Les articles sont détectés automatiquement."
              />

              <Benefit
                icon={<ShoppingCart size={18} />}
                title="Panier prêt"
                text="Ajoutez rapidement vos fournitures."
              />

              <Benefit
                icon={<ShieldCheck size={18} />}
                title="Simple & sécurisé"
                text="Vos données restent protégées."
              />

            </div>

            {/* CTA */}
            <div className="mt-8">
              <div className="inline-flex w-full items-center justify-between gap-4 rounded-2xl bg-brand-500 p-2.5 pl-5 text-white shadow-lg shadow-brand-500/20 transition-all duration-300 group-hover:bg-brand-600 sm:w-auto sm:min-w-[390px]">

                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                    <Camera size={22} />
                  </div>

                  <div>
                    <div className="font-bold">
                      Envoyer ma liste
                    </div>

                    <div className="text-xs text-white/75">
                      Photo ou image
                    </div>
                  </div>
                </div>

                <div className="mr-1 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-600 transition-transform duration-300 group-hover:translate-x-1">
                  <ArrowRight size={20} />
                </div>
              </div>
            </div>

            {/* Privacy */}
            <div className="mt-4 flex items-center gap-2 text-xs text-brand-700/60">
              <ShieldCheck size={15} />
              Vos données sont utilisées uniquement pour traiter votre liste.
            </div>
          </div>

          {/* ================= RIGHT ================= */}
          <div className="relative flex min-h-[300px] items-center justify-center overflow-hidden bg-gradient-to-br from-brand-50/80 via-white to-purple-50/60 p-6 sm:min-h-[380px] lg:min-h-[500px]">

            {/* Decorative circle */}
            <div className="absolute h-[280px] w-[280px] rounded-full bg-brand-100/50 blur-sm sm:h-[360px] sm:w-[360px]" />

            {/* Image */}
            <img
              src={schoolListCta}
              alt="Envoyer une photo de liste scolaire"
              className="relative z-10 max-h-[320px] w-full max-w-[460px] object-contain transition-transform duration-500  sm:max-h-[390px]"
            />

          </div>
        </div>

        {/* Bottom trust bar */}
        <div className="relative grid grid-cols-1 gap-3 border-t border-brand-100 bg-brand-50/40 px-7 py-4 sm:grid-cols-3 sm:px-10">

          <TrustItem
            icon={<ShieldCheck size={18} />}
            text="Données protégées"
          />

          <TrustItem
            icon={<Camera size={18} />}
            text="Photo en quelques secondes"
          />

          <TrustItem
            icon={<ShoppingCart size={18} />}
            text="Panier facile à préparer"
          />

        </div>
      </button>
    </section>
  );
}


/* =========================
   Benefit
========================= */

function Benefit({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
        {icon}
      </div>

      <div>
        <p className="text-sm font-bold text-brand-900">
          {title}
        </p>

        <p className="mt-0.5 text-xs leading-5 text-brand-700/65">
          {text}
        </p>
      </div>
    </div>
  );
}


/* =========================
   Trust item
========================= */

function TrustItem({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center justify-center gap-2 text-sm text-brand-700/70 sm:justify-start">
      <span className="text-brand-500">
        {icon}
      </span>

      <span>{text}</span>
    </div>
  );
}