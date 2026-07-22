import type { CSSProperties, FC } from "react";

interface ImageItem {
  src: string;
  alt: string;
}

interface InfiniteImageScrollProps {
  images: ImageItem[];
  /** Durée d'un cycle complet en secondes. Plus petit = plus rapide. */
  durationSeconds?: number;
  /** Sens du défilement. */
  direction?: "left" | "right";
  /** Hauteur des images (classe Tailwind, ex: "h-24"). */
  imageHeightClassName?: string;
}

/**
 * Défilement horizontal infini d'images, basé sur la technique Cruip :
 * https://cruip.com/create-an-infinite-horizontal-scroll-animation-with-tailwind-css/
 *
 * La liste est dupliquée deux fois dans le JSX (au lieu d'Alpine.js) : quand la
 * première liste atteint -100%, la seconde prend le relais exactement au même
 * endroit visuellement, ce qui rend la boucle invisible.
 *
 * ⚠️ Nécessite l'extension `animate-infinite-scroll` dans tailwind.config.js
 * (voir tailwind.config.snippet.js).
 */
export const InfiniteimagescrollSchool: FC<InfiniteImageScrollProps> = ({
  images,
  durationSeconds = 30,
  direction = "left",
  imageHeightClassName = "h-24",
}) => {
  const style = {
    "--scroll-duration": `${durationSeconds}s`,
  } as CSSProperties;

  const directionClass = direction === "right" ? "[animation-direction:reverse]" : "";

  return (
    <div
      style={style}
      className="w-full inline-flex flex-nowrap overflow-hidden pt-10 [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]"
    >
      {/* Premier passage */}
      <ul
        className={`flex items-center justify-center md:justify-start [&_li]:mx-8 [&_img]:max-w-none animate-infinite-scroll ${directionClass}`}
      >
        {images.map((image, index) => (
          <li key={`a-${index}`}>
            <img src={image.src} alt={image.alt} className={`${imageHeightClassName} w-auto object-contain`} />
          </li>
        ))}
      </ul>

      {/* Duplicata pour la boucle (masqué aux lecteurs d'écran) */}
      <ul
        aria-hidden="true"
        className={`flex items-center justify-center md:justify-start [&_li]:mx-8 [&_img]:max-w-none animate-infinite-scroll ${directionClass}`}
      >
        {images.map((image, index) => (
          <li key={`b-${index}`}>
            <img src={image.src} alt="" className={`${imageHeightClassName} w-auto object-contain`} />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InfiniteimagescrollSchool;