import { useState } from "react";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Accueil", href: "#" },
  { label: "Comment ça marche", href: "#" },
  { label: "Écoles", href: "#" },
  { label: "Livres", href: "#" },
  { label: "Fournitures", href: "#" },
  { label: "FAQ", href: "#" },
  { label: "Contact", href: "#" },
];

export default function NavBar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="mx-auto max-w-7xl px-6 pt-8 lg:px-8">
      <nav className="relative rounded-full px-6 py-3 backdrop-blur">
        <div className="flex items-center justify-between lg:justify-center">
          {/* Desktop links */}
          <ul className="hidden items-center gap-8 text-sm font-medium text-gray-600 lg:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="transition-colors duration-300 hover:text-[#1F9E93]"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-controls="mobile-nav-panel"
            className="ml-auto rounded-full p-2 text-gray-500 transition-colors duration-300 hover:bg-gray-50 hover:text-gray-900 lg:hidden"
          >
            <span className="sr-only">
              {open ? "Fermer le menu" : "Ouvrir le menu"}
            </span>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile panel */}
        {open && (
          <div
            id="mobile-nav-panel"
            className="mt-4 flex flex-col gap-1 border-t border-gray-100 pt-4 lg:hidden"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors duration-300 hover:bg-gray-50 hover:text-[#1F9E93]"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </nav>
    </header>
  );
}