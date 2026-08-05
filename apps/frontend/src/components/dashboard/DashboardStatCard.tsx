import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Card } from '../ui';

interface DashboardStatCardProps {
  title: string;
  value: string | number;

  icon: ReactNode;

  color?: string;

  change?: number;

  subtitle?: string;

  loading?: boolean;
}

export function DashboardStatCard({
  title,
  value,
  icon,
  change,
  subtitle,
  loading,
  color = 'bg-brand-100 text-brand-700',
}: DashboardStatCardProps) {
  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="h-28" />
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-brand-500">
            {title}
          </p>

          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-brand-900">
            {value}
          </h2>

          {subtitle && (
            <p className="mt-2 text-xs text-brand-400">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color}`}
        >
          {icon}
        </div>
      </div>

      {change !== undefined && (
        <div className="mt-5 flex items-center gap-2">
          {change >= 0 ? (
            <ArrowUpRight
              className="text-green-600"
              size={18}
            />
          ) : (
            <ArrowDownRight
              className="text-red-600"
              size={18}
            />
          )}

          <span
            className={`text-sm font-semibold ${
              change >= 0
                ? 'text-green-600'
                : 'text-red-600'
            }`}
          >
            {Math.abs(change)}%
          </span>

          <span className="text-sm text-brand-400">
            vs période précédente
          </span>
        </div>
      )}

      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-brand-50 opacity-40" />
    </Card>
  );
}