import { Route, Routes } from 'react-router-dom';
import { AdminLayout, PublicLayout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { CatalogPage } from './pages/CatalogPage';
import { SchoolListPage } from './pages/SchoolListPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { TrackPage } from './pages/TrackPage';
import { LoginPage } from './pages/LoginPage';
import { ActivateInvitationPage } from './pages/ActivateInvitationPage';
import { DashboardPage } from './pages/admin/DashboardPage';
import { OrdersPage } from './pages/admin/OrdersPage';
import { OrderDetailPage } from './pages/admin/OrderDetailPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminSchoolsPage } from './pages/admin/AdminSchoolsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminCatalogRefsPage } from './pages/admin/AdminCatalogRefsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="catalogue" element={<CatalogPage />} />
        <Route path="listes" element={<SchoolListPage />} />
        <Route path="panier" element={<CartPage />} />
        <Route path="commande" element={<CheckoutPage />} />
        <Route path="commande/confirmee" element={<OrderConfirmationPage />} />
        <Route path="suivi" element={<TrackPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="/connexion" element={<LoginPage />} />
      <Route path="/activer-compte" element={<ActivateInvitationPage />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="commandes" element={<OrdersPage />} />
        <Route path="commandes/:id" element={<OrderDetailPage />} />
        <Route
          path="produits"
          element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
              <AdminProductsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="ecoles"
          element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
              <AdminSchoolsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="catalogue-refs"
          element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
              <AdminCatalogRefsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="utilisateurs"
          element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
