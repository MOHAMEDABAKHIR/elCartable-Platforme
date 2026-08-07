import { useQuery } from '@tanstack/react-query';

import { fetchDashboard } from '../../lib/queries';
import type { DashboardOverview } from '../../lib/types';

import {
  Spinner,
  Alert,
  Card,
  Badge,
} from '../../components/ui';

import {
  ORDER_STATUS_LABELS,
  orderStatusColor,
  formatMAD,
} from '../../lib/format';

import { RevenueChart } from '../../components/dashboard/RevenueChart';
import { StatsGrid } from '../../components/dashboard/StatsGrid';
import { TopProductsCard } from '../../components/dashboard/TopProductsCard';
import { TopSchoolsCard } from '../../components/dashboard/TopSchoolsCard';
import { LatestOrdersTable } from '../../components/dashboard/LatestOrdersTable';
import { LowStockCard } from '../../components/dashboard/LowStockCard';
import { ActivityTimeline } from '../../components/dashboard/ActivityTimeline';

// function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
//   return (
//     <Card>
//       <p className="text-sm text-brand-500">{label}</p>
//       <p className="mt-1 text-2xl font-extrabold text-brand-800">{value}</p>
//       {hint && <p className="mt-1 text-xs text-brand-400">{hint}</p>}
//     </Card>
//   );
// }

// export function DashboardPage() {
//   const { data, isLoading, isError } = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboard });

//   if (isLoading) return <Spinner label="Chargement du tableau de bord…" />;
//   if (isError || !data) return <Alert>Impossible de charger le tableau de bord.</Alert>;

//   const { orders, visitors } = data;
//   const conversionRate = visitors.sessionsCount
//     ? Math.round((visitors.convertedSessions / visitors.sessionsCount) * 100)
//     : 0;

//   return (
//     <div className="space-y-6">
//       <h1 className="text-2xl font-extrabold text-brand-900">Tableau de bord</h1>

//       <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
//         <Stat label="Commandes" value={String(orders.totalOrders)} />
//         <Stat label="Chiffre d'affaires" value={formatMAD(orders.totalRevenue)} hint="Hors commandes annulées" />
//         <Stat label="Panier moyen" value={formatMAD(orders.averageCartValue)} />
//         <Stat label="Taux de conversion" value={`${conversionRate}%`} hint={`${visitors.newVisitorsCount} visiteurs`} />
//       </div>

//       <Card>
//         <h2 className="font-bold text-brand-800">Commandes par statut</h2>
//         <div className="mt-4 flex flex-wrap gap-2">
//           {Object.entries(orders.byStatus).length === 0 && (
//             <p className="text-sm text-brand-500">Aucune commande pour la période.</p>
//           )}
//           {Object.entries(orders.byStatus).map(([status, count]) => (
//             <Badge key={status} className={orderStatusColor(status as OrderStatus)}>
//               {ORDER_STATUS_LABELS[status as OrderStatus] ?? status} · {count}
//             </Badge>
//           ))}
//         </div>
//       </Card>
//     </div>
//   );
// }
export function DashboardPage() {

  const {

    data,

    isLoading,

    isError,

  } = useQuery<DashboardOverview>({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
  });

  if (isLoading) {
    return <Spinner label="Chargement du tableau de bord..." />;
  }

  if (isError || !data) {
    return (
      <Alert>
        Impossible de charger le tableau de bord.
      </Alert>
    );
  }

  const conversionRate =
    data.visitors.sessionsCount === 0
      ? 0
      : Math.round(
        (data.visitors.convertedSessions /
          data.visitors.sessionsCount) *
        100,
      );

  const abandonmentRate = Math.round(
    data.visitors.abandonmentRate * 100,
  );
  return (

    <div className="space-y-8">

      <div>

        <h1 className="text-3xl font-extrabold text-brand-900">

          Tableau de bord

        </h1>

        <p className="mt-1 text-brand-500">

          Vue générale de l'activité elCartable.

        </p>

      </div>

      <StatsGrid

        orders={data.orders}

        visitors={data.visitors}

      />

      <RevenueChart

        data={data.revenueHistory}

      />

      <Card>

        <div className="mb-4">

          <h2 className="text-lg font-bold">

            Répartition des commandes

          </h2>

        </div>

        <div className="flex flex-wrap gap-3">

          {Object.entries(data.orders.byStatus).map(

            ([status, count]) => (

              <Badge

                key={status}

                className={orderStatusColor(status as never)}

              >

                {ORDER_STATUS_LABELS[status as never]}

                {' • '}

                {count}

              </Badge>

            ),

          )}

        </div>

      </Card>
            <div className="grid gap-6 xl:grid-cols-2">

        <TopProductsCard
          products={data.topProducts}
        />

        <TopSchoolsCard
          schools={data.topSchools}
        />

      </div>

      <div className="grid gap-6 lg:grid-cols-3">

        <Card>

          <h2 className="mb-5 text-lg font-bold text-brand-900">
            Conversion
          </h2>

          <div className="space-y-4">

            <div className="flex items-center justify-between">

              <span className="text-brand-500">
                Sessions
              </span>

              <span className="font-bold">
                {data.visitors.sessionsCount}
              </span>

            </div>

            <div className="flex items-center justify-between">

              <span className="text-brand-500">
                Conversions
              </span>

              <span className="font-bold text-green-600">
                {data.visitors.convertedSessions}
              </span>

            </div>

            <div className="flex items-center justify-between">

              <span className="text-brand-500">
                Taux de conversion
              </span>

              <span className="font-bold text-blue-600">
                {conversionRate}%
              </span>

            </div>

            <div className="flex items-center justify-between">

              <span className="text-brand-500">
                Abandon panier
              </span>

              <span className="font-bold text-red-600">
                {abandonmentRate}%
              </span>

            </div>

            <div className="flex items-center justify-between">

              <span className="text-brand-500">
                Temps moyen
              </span>

              <span className="font-bold">

                {data.visitors.averageTimeToConversionSeconds == null
                  ? '-'
                  : `${Math.round(
                      data.visitors.averageTimeToConversionSeconds / 60,
                    )} min`}

              </span>

            </div>

          </div>

        </Card>

        <Card>

          <h2 className="mb-5 text-lg font-bold text-brand-900">
            Top villes
          </h2>

          <div className="space-y-3">

            {data.topCities.map((city) => (

              <div
                key={city.city}
                className="flex items-center justify-between"
              >

                <span>
                  {city.city}
                </span>

                <div className="text-right">

                  <div className="font-semibold">
                    {city.orders} commandes
                  </div>

                  <div className="text-xs text-brand-500">
                    {formatMAD(city.revenue)}
                  </div>

                </div>

              </div>

            ))}

          </div>

        </Card>

        <Card>

          <h2 className="mb-5 text-lg font-bold text-brand-900">
            Top niveaux
          </h2>

          <div className="space-y-3">

            {data.topGrades.map((grade) => (

              <div
                key={grade.gradeId}
                className="flex items-center justify-between"
              >

                <span>
                  {grade.gradeName}
                </span>

                <div className="text-right">

                  <div className="font-semibold">
                    {grade.orders} commandes
                  </div>

                  <div className="text-xs text-brand-500">
                    {formatMAD(grade.revenue)}
                  </div>

                </div>

              </div>

            ))}

          </div>

        </Card>

      </div>
            <div className="grid gap-6 xl:grid-cols-2">

        <LatestOrdersTable
          orders={data.latestOrders}
        />

        <LowStockCard
          products={data.lowStockProducts}
        />

      </div>

      <ActivityTimeline
        activities={data.activities}
      />

    </div>

  );
}