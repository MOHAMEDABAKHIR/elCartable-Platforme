/**
 * Page « celouer » (squelette / wireframe) en noir & blanc de la landing page.
 * Les vraies images / vidéo seront ajoutées plus tard : chaque bloc gris est un
 * emplacement (placeholder) légendé par le nom du média du wireframe.
 *
 * Les images 4 → 10 forment une galerie horizontale à défilement infini (marquee).
 */

const NAV_LINKS = ['Accueil', 'Comment ça marche', 'Écoles', 'Livres', 'Fournitures', 'FAQ', 'Contact'];

// Placeholders des images 4 à 10 de la galerie défilante.
const GALLERY_IMAGES = [4, 5, 6, 7, 8, 9, 10];

function Placeholder({ label, className }: { label: string; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center border border-neutral-300 bg-neutral-200 text-center text-sm font-medium text-neutral-600 ${className ?? ''}`}
    >
      {label}
    </div>
  );
}

function Divider() {
  return <hr className="border-t border-black" />;
}

function GalleryCard({ n }: { n: number }) {
  return (
    <Placeholder
      label={`Image ${n} png`}
      className="h-40 w-64 shrink-0 rounded-lg"
    />
  );
}

export function CelouerLandingPage() {
  return (
    <div className="min-h-screen bg-white text-black">
      {/* Navbar */}
      <header className="sticky top-0 z-20 border-b border-black bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span className="text-xl font-black tracking-tight">elCartable</span>
          <nav className="flex flex-wrap items-center gap-5 text-sm font-medium">
            {NAV_LINKS.map((link) => (
              <a key={link} href="#" className="text-neutral-700 hover:text-black hover:underline">
                {link}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4">
        {/* Hero */}
        <section className="grid items-start gap-8 py-12 md:grid-cols-2">
          <div className="space-y-6">
            <Placeholder label="Image 2 png" className="h-40 w-full rounded-lg" />
            <h1 className="text-3xl font-black leading-tight md:text-4xl">Phrase en gras 1</h1>
            <p className="text-base leading-relaxed text-neutral-700">
              Paragraphe 1 — texte descriptif de présentation qui sera remplacé par le contenu réel.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <select className="rounded-lg border border-black bg-white px-3 py-2 text-sm">
                <option>dropdown list 1</option>
              </select>
              <select className="rounded-lg border border-black bg-white px-3 py-2 text-sm">
                <option>dropdown list 2</option>
              </select>
              <button
                type="button"
                className="rounded-lg bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
              >
                Button 1 (cta)
              </button>
            </div>
          </div>
          <Placeholder label="Image1 png" className="h-[28rem] w-full rounded-lg" />
        </section>

        {/* Image 3 + séparateur */}
        <section className="pb-6">
          <Placeholder label="Image 3 png" className="h-28 w-72 rounded-lg" />
        </section>
        <Divider />

        {/* Phrase en gras 2 */}
        <h2 className="py-10 text-center text-2xl font-black md:text-3xl">Phrase en gras 2</h2>
      </main>

      {/* Galerie horizontale à défilement infini (images 4 → 10) */}
      <section className="marquee-group overflow-hidden py-4">
        <div className="flex w-max animate-marquee gap-6 pl-6">
          {/* Deux copies consécutives pour une boucle sans couture (translateX -50%). */}
          {[...GALLERY_IMAGES, ...GALLERY_IMAGES].map((n, i) => (
            <GalleryCard key={`${n}-${i}`} n={n} />
          ))}
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4">
        {/* Phrase en gras 3 */}
        <h2 className="py-10 text-center text-2xl font-black md:text-3xl">Phrase en gras 3</h2>
        <Divider />

        {/* Phrase en gras 4 + vidéo */}
        <section className="space-y-8 py-12">
          <h2 className="text-center text-2xl font-black md:text-3xl">Phrase en gras 4</h2>
          <Placeholder label="video 1 MP4" className="mx-auto aspect-video w-full max-w-4xl rounded-lg" />
        </section>
        <Divider />

        {/* Phrase en gras 5 + Image 11 */}
        <section className="grid items-center gap-6 py-8 md:grid-cols-2">
          <h2 className="text-2xl font-black md:text-3xl">Phrase en gras 5</h2>
          <Placeholder label="Image 11 png" className="ml-auto h-28 w-72 rounded-lg" />
        </section>

        {/* Image 12 + Paragraphe 2 (FAQ) */}
        <section className="grid items-center gap-8 py-4 md:grid-cols-[1fr_2fr]">
          <Placeholder label="Image 12 png" className="h-72 w-full rounded-lg" />
          <div className="space-y-3">
            <Placeholder label="Paragraphe 2 (FAQ)" className="h-72 w-full rounded-lg" />
          </div>
        </section>

        {/* Button 2 (cta) */}
        <div className="flex justify-center py-8">
          <button
            type="button"
            className="rounded-lg bg-black px-8 py-3 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            Button 2 (cta)
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-black bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-[1fr_2fr]">
          <Placeholder label="Image 2 png" className="h-28 w-full max-w-xs rounded-lg" />
          <Placeholder label="les éléments de footer avec map" className="h-28 w-full rounded-lg" />
        </div>
      </footer>
    </div>
  );
}
