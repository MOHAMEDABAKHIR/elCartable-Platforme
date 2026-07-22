import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useCart } from '../store/cart';
import { useAuth } from '../store/auth';
import Footer from "./Footer";
import NavBar from './Navbar';

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-lg font-black text-white">
        e
      </span>
      <span className="text-lg font-extrabold tracking-tight text-brand-800">
        el<span className="text-accent-400">Cartable</span>
      </span>
    </Link>
  );
}

export function PublicLayout() {
  const { totalItems } = useCart();
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20">
        {/* <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Logo />
          <nav className="flex items-center gap-4 text-sm font-medium text-brand-700">
            <NavLink to="/catalogue" className="hover:text-brand-900">
              Catalogue
            </NavLink>
            <NavLink to="/suivi" className="hover:text-brand-900">
              Suivi
            </NavLink>
            <Link to="/panier" className="relative rounded-lg bg-brand-100 px-3 py-1.5 text-brand-800">
              Panier
              {totalItems > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-400 px-1 text-xs font-bold text-brand-900">
                  {totalItems}
                </span>
              )}
            </Link>
            <Link
              to={isAuthenticated ? '/admin' : '/connexion'}
              className="rounded-lg border border-brand-200 px-3 py-1.5 hover:bg-brand-50"
            >
              {isAuthenticated ? 'Espace pro' : 'Connexion'}
            </Link>
          </nav>
        </div> */}
        <NavBar/>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4">
        <Outlet />
      </main>

      <Footer/>
    </div>
  );
}

const ADMIN_NAV = [
  { to: '/admin', label: 'Tableau de bord', end: true },
  { to: '/admin/commandes', label: 'Commandes' },
  { to: '/admin/produits', label: 'Produits', roles: ['ADMIN', 'SUPER_ADMIN'] },
  { to: '/admin/ecoles', label: 'Écoles', roles: ['ADMIN', 'SUPER_ADMIN'] },
  { to: '/admin/catalogue-refs', label: 'Catégories & niveaux', roles: ['ADMIN', 'SUPER_ADMIN'] },
  { to: '/admin/utilisateurs', label: 'Utilisateurs', roles: ['ADMIN', 'SUPER_ADMIN'] },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/connexion');
  };

  const visibleNav = ADMIN_NAV.filter((item) => !item.roles || (user && item.roles.includes(user.role)));

  return (
    <div className="flex min-h-full">
      <aside className="hidden w-60 flex-col border-r border-brand-100 bg-white p-4 md:flex">
        <Logo />
        <nav className="mt-8 flex flex-1 flex-col gap-1 text-sm">
          {visibleNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 font-medium ${
                  isActive ? 'bg-brand-100 text-brand-800' : 'text-brand-600 hover:bg-brand-50'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-4 border-t border-brand-100 pt-4 text-sm">
          <p className="font-semibold text-brand-800">{user?.fullName}</p>
          <p className="text-xs text-brand-500">{user?.role}</p>
          <button onClick={handleLogout} className="mt-2 text-xs font-semibold text-red-600 hover:underline">
            Déconnexion
          </button>
        </div>
      </aside>

      <div className="flex-1 bg-brand-50">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
