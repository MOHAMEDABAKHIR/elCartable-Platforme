import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
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
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20">
        <NavBar />
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-12">
        <Outlet />
      </main>

      <Footer />
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
