import type { ReactNode } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';
import clsx from 'clsx';

import { Card } from '../ui';

interface Props {
  title: string;
  value: string | number;
  icon: ReactNode;

  subtitle?: string;
  color?: string;

  trend?: number;
  trendLabel?: string;
  footer?: string;
}

export function DashboardStatCard({
  title,
  value,
  icon,
  subtitle,
  color,
  trend,
  trendLabel,
  footer,
}: Props) {
  const positive = (trend ?? 0) >= 0;

  return (
    <Card className="group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-brand-500">
            {title}
          </p>

          <h3 className="mt-3 text-3xl font-extrabold text-brand-900">
            {value}
          </h3>

          {subtitle && (
            <p className="mt-2 text-sm text-brand-500">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={clsx(
            'rounded-2xl p-3 transition group-hover:scale-110',
            color ?? 'bg-brand-100 text-brand-700'
          )}
        >
          {icon}
        </div>
      </div>

      {trend !== undefined && (
        <div className="mt-6 flex items-center justify-between">
          <div
            className={clsx(
              'inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold',
              positive
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            )}
          >
            {positive ? (
              <ArrowUpRight size={16} />
            ) : (
              <ArrowDownRight size={16} />
            )}

            {Math.abs(trend)}%
          </div>

          <span className="text-xs text-brand-500">
            {trendLabel}
          </span>
        </div>
      )}

      {(footer || subtitle) && (
        <p className="mt-5 border-t border-brand-100 pt-4 text-xs text-brand-400">
          {footer ?? subtitle}
        </p>
      )}
    </Card>
  );
}