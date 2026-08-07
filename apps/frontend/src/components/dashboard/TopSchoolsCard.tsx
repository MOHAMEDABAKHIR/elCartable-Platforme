import { Card } from '../ui';
import { formatMAD } from '../../lib/format';

interface SchoolItem {
  schoolId: string;
  schoolName: string;
  orders: number;
  revenue: number;
}

interface TopSchoolsCardProps {
  schools: SchoolItem[];
}

export function TopSchoolsCard({
  schools,
}: TopSchoolsCardProps) {
  return (
    <Card>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-bold text-brand-900">
          Écoles les plus actives
        </h2>

        <span className="text-sm text-brand-500">
          Top {schools.length}
        </span>
      </div>

      {schools.length === 0 ? (
        <p className="text-sm text-brand-500">
          Aucune donnée disponible.
        </p>
      ) : (
        <div className="space-y-4">

          {schools.map((school, index) => (

            <div
              key={school.schoolId || school.schoolName}
              className="flex items-center justify-between border-b border-brand-100 pb-3 last:border-0 last:pb-0"
            >

              <div className="flex items-center gap-3">

                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700">
                  {index + 1}
                </div>


                <div>

                  <p className="font-medium text-brand-900">
                    {school.schoolName}
                  </p>

                  <p className="text-xs text-brand-500">
                    {school.orders} commande
                    {school.orders > 1 ? 's' : ''}
                  </p>

                </div>

              </div>


              <div className="text-right">

                <p className="font-semibold text-brand-900">
                  {formatMAD(school.revenue)}
                </p>

              </div>

            </div>

          ))}

        </div>
      )}

    </Card>
  );
}