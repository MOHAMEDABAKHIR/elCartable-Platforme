import { Card } from '../ui';
import { formatMAD } from '../../lib/format';

interface StatsGridProps {
  orders: {
    totalOrders: number;
    totalRevenue: number;
    averageCartValue: number;
  };

  visitors: {
    sessionsCount: number;
    convertedSessions: number;
    newVisitorsCount: number;
  };
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <Card>
      <p className="text-sm text-brand-500">{title}</p>

      <p className="mt-2 text-3xl font-bold text-brand-900">
        {value}
      </p>

      {subtitle && (
        <p className="mt-2 text-xs text-brand-500">
          {subtitle}
        </p>
      )}
    </Card>
  );
}

export function StatsGrid({
  orders,
  visitors,
}: StatsGridProps) {
  const conversionRate =
    visitors.sessionsCount === 0
      ? 0
      : Math.round(
          (visitors.convertedSessions /
            visitors.sessionsCount) *
            100,
        );

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

      <StatCard
        title="Commandes"
        value={orders.totalOrders}
      />

      <StatCard
        title="Chiffre d'affaires"
        value={formatMAD(orders.totalRevenue)}
      />

      <StatCard
        title="Panier moyen"
        value={formatMAD(orders.averageCartValue)}
      />

      <StatCard
        title="Conversion"
        value={`${conversionRate}%`}
        subtitle={`${visitors.newVisitorsCount} nouveaux visiteurs`}
      />

    </div>
  );
}