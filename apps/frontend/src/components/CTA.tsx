interface CtaButtonsProps {
  primaryLabel?: string;
  secondaryLabel?: string;
  primaryHref?: string;
  secondaryHref?: string;
}

export default function CtaButtons({
  primaryLabel = "Get started",
  primaryHref = "#",
}: CtaButtonsProps) {
  return (
    <div className="mt-10 flex items-center justify-center gap-x-6 lg:justify-center">
      <a
        href={primaryHref}
        className="rounded-md bg-[#8a75bf] px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-[#5f4c89] shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {primaryLabel}
      </a>
    </div>
  );
}