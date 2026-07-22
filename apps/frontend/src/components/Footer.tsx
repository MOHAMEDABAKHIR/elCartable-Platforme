import type { FC, FormEvent, SVGProps } from "react";
import { MapPin, Phone, Mail, Clock, ArrowRight } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

interface SocialLink {
  label: string;
  href: string;
  Icon: FC<SVGProps<SVGSVGElement>>;
}

/* ------------------------------------------------------------------ */
/*  Static content                                                     */
/* ------------------------------------------------------------------ */

const columns: FooterColumn[] = [
  {
    title: "Produits",
    links: [
      { label: "Toutes les listes", href: "/listes" },
      { label: "Primaire", href: "/listes/primaire" },
      { label: "Collège", href: "/listes/college" },
      { label: "Lycée", href: "/listes/lycee" },
      { label: "Papeterie", href: "/produits/papeterie" },
      { label: "Cartables", href: "/produits/cartables" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Comment ça marche", href: "/comment-ca-marche" },
      { label: "Livraison", href: "/livraison" },
      { label: "Paiement", href: "/paiement" },
      { label: "Suivi de commande", href: "/suivi" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Entreprise",
    links: [
      { label: "À propos", href: "/a-propos" },
      { label: "Nos partenaires", href: "/partenaires" },
      { label: "Nos écoles", href: "/ecoles" },
      { label: "Carrières", href: "/carrieres" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Centre d'aide", href: "/aide" },
      { label: "Contact", href: "/contact" },
      { label: "Conditions", href: "/conditions" },
      { label: "Confidentialité", href: "/confidentialite" },
      { label: "Mentions légales", href: "/mentions-legales" },
    ],
  },
];

const trustBadges: string[] = [
  "Livraison partout au Maroc",
  "Paiement à la livraison",
  "Produits officiels",
];

/**
 * Lucide React a retiré les icônes de marques (Facebook, Instagram,
 * LinkedIn, TikTok...) de ses exports. Elles sont donc recréées ici en SVG
 * inline, dans le même style "stroke" que les icônes Lucide utilisées
 * ailleurs dans ce footer.
 */
const FacebookIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const LinkedinIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const TiktokIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 12a4 4 0 1 0 4 4V3.5c.5 2.5 2.5 4.5 5 4.9" />
  </svg>
);

const socialLinks: SocialLink[] = [
  // TODO: remplacer les hrefs ci-dessous par les vrais liens des réseaux sociaux
  { label: "Facebook", href: "https://facebook.com/elcartable", Icon: FacebookIcon },
  { label: "Instagram", href: "https://instagram.com/elcartable", Icon: InstagramIcon },
  { label: "TikTok", href: "https://tiktok.com/@elcartable", Icon: TiktokIcon },
  { label: "LinkedIn", href: "https://linkedin.com/company/elcartable", Icon: LinkedinIcon },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const Footer: FC = () => {

  return (
    <footer className="relative overflow-hidden bg-slate-950 py-6 text-center text-sm">
      {/* Texture / gradient très discret en fond */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_-10%,rgba(124,58,237,0.15),transparent),radial-gradient(ellipse_60%_40%_at_90%_0%,rgba(45,212,191,0.10),transparent)]"
      />

      <div className="relative mx-auto max-w-7xl px-6 pt-16 sm:px-8 sm:pt-20 lg:px-12">
        {/* -------------------------------------------------------- */}
        {/* Grille principale                                        */}
        {/* -------------------------------------------------------- */}
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-6 lg:gap-8">
          {/* Colonne logo */}
          <div className="sm:col-span-2 lg:col-span-1 ">
            {/* TODO: remplacer par le chemin réel du logo si nécessaire */}
            <img
              src="./public/elCartablecrop1.png"
              alt="ElCartable"
              className="transition-opacity duration-300 hover:opacity-100 py-5"
            />

            <div className="mt-8 flex items-center gap-3">
              {socialLinks.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-slate-400 transition-colors duration-300 hover:border-violet-600 hover:text-violet-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                >
                  <Icon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                </a>
              ))}
            </div>
          </div>

          {/* Colonnes de liens */}
          {columns.map((column) => (
            <nav
              key={column.title}
              aria-label={column.title}
              className="lg:col-span-1"
            >
              <h3 className="text-sm font-semibold tracking-tight text-white">
                {column.title}
              </h3>
              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="inline-block text-sm leading-relaxed text-slate-400 transition-all duration-300 hover:translate-x-1 hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* Colonne contact */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className="text-sm font-semibold tracking-tight text-white">
              Contact
            </h3>
            <address className="mt-5 space-y-3 text-sm not-italic leading-relaxed text-slate-400">
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" aria-hidden="true" />
                {/* TODO: remplacer par l'adresse réelle */}
                <span>123 Avenue Hassan II, Casablanca, Maroc</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-teal-400" aria-hidden="true" />
                <a
                  href="tel:+212600000000"
                  className="transition-colors duration-300 hover:text-white"
                >
                  +212 6 00 00 00 00
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-teal-400" aria-hidden="true" />
                <a
                  href="mailto:contact@elcartable.ma"
                  className="transition-colors duration-300 hover:text-white"
                >
                  contact@elcartable.ma
                </a>
              </p>
              <p className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" aria-hidden="true" />
                <span>
                  Lun - Sam
                  <br />
                  9h00 - 18h00
                </span>
              </p>
            </address>
          </div>
        </div>
        <iframe
              src="https://www.google.com/maps?q=Habous,Casablanca,Morocco&output=embed"
              width="100%"
              height={300}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Localisation ElCartable"
              className="w-full border-0 pt-5 pb-0"
            />

        {/* -------------------------------------------------------- */}
        {/* Google Maps                                               */}
        {/* -------------------------------------------------------- */}
        {/* <div className="mt-14 overflow-hidden rounded-2xl shadow-lg shadow-black/30">
          <iframe
            src="https://www.google.com/maps?q=Habous,Casablanca,Morocco&output=embed"
            width="100%"
            height={250}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Localisation ElCartable"
            className="w-full border-0"
          />
        </div> */}

        {/* -------------------------------------------------------- */}
        {/* Newsletter                                                */}
        {/* -------------------------------------------------------- */}


        {/* -------------------------------------------------------- */}
        {/* Copyright                                                 */}
        {/* -------------------------------------------------------- */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-sm leading-relaxed text-slate-400">
            © 2026 ElCartable. Tous droits réservés.
          </p>
          <p className="text-sm leading-relaxed text-slate-400">
            ❤️🇲🇦 دخول مدرسي بلا صداع الراس
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;