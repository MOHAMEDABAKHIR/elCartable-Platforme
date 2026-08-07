import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card } from '../ui';
import { ORDER_STATUS_LABELS } from '../../lib/format';
import type { OrderStatus } from '../../lib/types';

interface Props {
  data: Record<string, number>;
}

const COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#F97316',
  '#EF4444',
];

export function OrdersStatusChart({ data }: Props) {
  const chartData = Object.entries(data).map(([status, value]) => ({
    name: ORDER_STATUS_LABELS[status as OrderStatus] ?? status,
    value,
  }));

  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-brand-900">
          Répartition des commandes
        </h2>

        <p className="text-sm text-brand-500">
          Par statut
        </p>
      </div>

      <div className="h-80">

        <ResponsiveContainer>

          <PieChart>

            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={65}
              outerRadius={105}
              paddingAngle={3}
            >

              {chartData.map((_, index) => (

                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                />

              ))}

            </Pie>

            <Tooltip />

            <Legend />

          </PieChart>

        </ResponsiveContainer>

      </div>
    </Card>
  );
}