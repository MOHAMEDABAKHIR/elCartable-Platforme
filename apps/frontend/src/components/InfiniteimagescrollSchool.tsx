import type { CSSProperties, FC } from "react";
import { useMemo } from "react";
import { MapPin } from "lucide-react";

interface ImageItem {
  src: string;
  alt: string;
  name: string;
  adress?: string | null;
}

interface InfiniteImageScrollProps {
  images: ImageItem[];
  /**
   * Durée d'un cycle complet en secondes.
   * Si omis, elle est calculée automatiquement à partir du nombre d'images
   * (voir `secondsPerImage`), pour garder une vitesse de défilement constante
   * peu importe le nombre d'éléments.
   */
  durationSeconds?: number;
  /** Nombre de secondes attribuées par image quand `durationSeconds` n'est pas fourni. */
  secondsPerImage?: number;
  /** Durée minimale/maximale pour éviter un scroll trop rapide ou trop lent. */
  minDurationSeconds?: number;
  maxDurationSeconds?: number;
  /** Sens du défilement. */
  direction?: "left" | "right";
  /** Hauteur des images (classe Tailwind, ex: "h-24"). */
  imageHeightClassName?: string;
  /** Met le défilement en pause au survol. */
  pauseOnHover?: boolean;
  /** Nom affiché sous chaque image. */
}

/**
 * Défilement horizontal infini d'images, basé sur la technique Cruip :
 * https://cruip.com/create-an-infinite-horizontal-scroll-animation-with-tailwind-css/
 *
 * La liste est dupliquée deux fois dans le JSX : quand la première liste
 * atteint -100%, la seconde prend le relais exactement au même endroit
 * visuellement, ce qui rend la boucle invisible.
 *
 * ⚠️ Nécessite l'extension `animate-infinite-scroll` dans tailwind.config.js.
 */
export const InfiniteimagescrollSchool: FC<InfiniteImageScrollProps> = ({
  images,
  durationSeconds,
  secondsPerImage = 3,
  minDurationSeconds = 12,
  maxDurationSeconds = 460,
  direction = "left",
  imageHeightClassName = "h-24",
  pauseOnHover = true,
}) => {
  const computedDuration = useMemo(() => {
    if (durationSeconds) return durationSeconds;
    if (images.length === 0) return minDurationSeconds;

    const raw = images.length * secondsPerImage;
    return Math.min(Math.max(raw, minDurationSeconds), maxDurationSeconds);
  }, [durationSeconds, images.length, secondsPerImage, minDurationSeconds, maxDurationSeconds]);

  const style = {
    "--scroll-duration": `${computedDuration}s`,
  } as CSSProperties;

  const directionClass = direction === "right" ? "[animation-direction:reverse]" : "";
  const hoverPauseClass = pauseOnHover ? "hover:[animation-play-state:paused]" : "";

  if (images.length === 0) return null;

  const renderList = (ariaHidden: boolean) => (
    <ul
      aria-hidden={ariaHidden || undefined}
      className={`flex items-center flex-nowrap [&_li]:mx-8 [&_img]:max-w-none animate-infinite-scroll ${directionClass} ${hoverPauseClass}`}
    >
      {images.map((image, index) => (
        <li
          key={`${ariaHidden ? "dup" : "orig"}-${image.src}-${index}`}
          className="flex flex-col items-center gap-2 shrink-0"
        >
          <img
            src={image.src}
            alt={ariaHidden ? "" : image.alt}
            draggable={false}
            loading="lazy"
            className={`${imageHeightClassName} w-auto object-contain select-none transition-transform duration-300 will-change-transform hover:scale-105`}
          />
          <span className="mt-2 text-center ">
            {image.name}
          </span>
          <div className="flex items-center justify-center gap-1 text-center">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{image.adress}</span>
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <div
      style={style}
      role="marquee"
      className="group w-full overflow-hidden pt-10 [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]"
    >
      <div className="inline-flex w-max flex-nowrap">
        {renderList(false)}
        {renderList(true)}
      </div>
    </div>
  );
};

export default InfiniteimagescrollSchool;