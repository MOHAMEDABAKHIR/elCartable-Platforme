import { useQuery } from '@tanstack/react-query';
import { fetchDashboard } from '../../lib/queries';
import { ORDER_STATUS_LABELS, formatMAD, orderStatusColor } from '../../lib/format';
import { Alert, Badge, Card, Spinner } from '../../components/ui';
import type { OrderStatus } from '../../lib/types';

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <p className="text-sm text-brand-500">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-brand-800">{value}</p>
      {hint && <p className="mt-1 text-xs text-brand-400">{hint}</p>}
    </Card>
  );
}

export function DashboardPage() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboard });

  if (isLoading) return <Spinner label="Chargement du tableau de bord…" />;
  if (isError || !data) return <Alert>Impossible de charger le tableau de bord.</Alert>;

  const { orders, visitors } = data;
  const conversionRate = visitors.sessionsCount
    ? Math.round((visitors.convertedSessions / visitors.sessionsCount) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-brand-900">Tableau de bord</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Commandes" value={String(orders.totalOrders)} />
        <Stat label="Chiffre d'affaires" value={formatMAD(orders.totalRevenue)} hint="Hors commandes annulées" />
        <Stat label="Panier moyen" value={formatMAD(orders.averageCartValue)} />
        <Stat label="Taux de conversion" value={`${conversionRate}%`} hint={`${visitors.newVisitorsCount} visiteurs`} />
      </div>

      <Card>
        <h2 className="font-bold text-brand-800">Commandes par statut</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(orders.byStatus).length === 0 && (
            <p className="text-sm text-brand-500">Aucune commande pour la période.</p>
          )}
          {Object.entries(orders.byStatus).map(([status, count]) => (
            <Badge key={status} className={orderStatusColor(status as OrderStatus)}>
              {ORDER_STATUS_LABELS[status as OrderStatus] ?? status} · {count}
            </Badge>
          ))}
        </div>
      </Card>
    </div>
  );
}
