import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, ShoppingCart } from "lucide-react";
import { useCart } from "../store/cart";

const NAV_LINKS = [
  { label: "Accueil", to: "/" },
  { label: "Catalogue", to: "/catalogue" },
  { label: "Listes scolaires", to: "/listes" },
  { label: "Suivi de commande", to: "/suivi" },
];

const linkBase = "transition-colors duration-300";

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const { totalItems } = useCart();

  return (
    <header className="mx-auto max-w-7xl px-6 pt-8 lg:px-8">
      <nav className="relative rounded-full px-6 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 font-extrabold text-brand-700">
            <img src="/elCartablecrop1.png" alt="elCartable" className="h-8 w-auto" />
          </Link>

          {/* Desktop links */}
          <ul className="hidden items-center gap-8 text-sm font-medium text-brand-700 lg:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <NavLink
                  to={link.to}
                  end={link.to === "/"}
                  className={({ isActive }) =>
                    `${linkBase} ${isActive ? "text-brand-600 font-semibold" : "text-brand-700/80 hover:text-brand-600"}`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Right: cart + mobile toggle */}
          <div className="flex items-center gap-2">
            <Link
              to="/panier"
              aria-label="Panier"
              className="relative rounded-full p-2 text-brand-700 transition-colors duration-300 hover:bg-brand-50 hover:text-brand-600"
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-400 px-1 text-[11px] font-bold text-brand-900">
                  {totalItems}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              aria-expanded={open}
              aria-controls="mobile-nav-panel"
              className="rounded-full p-2 text-brand-600 transition-colors duration-300 hover:bg-brand-50 hover:text-brand-700 lg:hidden"
            >
              <span className="sr-only">{open ? "Fermer le menu" : "Ouvrir le menu"}</span>
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile panel */}
        {open && (
          <div
            id="mobile-nav-panel"
            className="mt-4 flex flex-col gap-1 border-t border-brand-100 pt-4 lg:hidden"
          >
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.label}
                to={link.to}
                end={link.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-300 ${
                    isActive ? "bg-brand-50 text-brand-700" : "text-brand-700/80 hover:bg-brand-50 hover:text-brand-600"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        )}
      </nav>
    </header>
  );
}
