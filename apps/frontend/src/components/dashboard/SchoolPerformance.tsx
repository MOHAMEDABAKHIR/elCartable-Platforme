import { GraduationCap, TrendingUp } from 'lucide-react';

import { Card } from '../ui';

import { formatMAD } from '../../lib/format';

interface SchoolPerformanceItem {

  schoolId: string;

  schoolName: string;

  city: string;

  revenue: number;

  orders: number;

  averageCart: number;

}

interface Props {

  data: SchoolPerformanceItem[];

}

export function SchoolPerformance({ data }: Props) {

  return (

    <Card>

      <div className="mb-8 flex items-center gap-3">

        <div className="rounded-xl bg-indigo-100 p-3">

          <GraduationCap className="text-indigo-700" />

        </div>

        <div>

          <h2 className="text-xl font-bold">

            Performance des écoles

          </h2>

          <p className="text-sm text-brand-500">

            Classement par chiffre d'affaires

          </p>

        </div>

      </div>

      <div className="space-y-5">

        {data.map((school) => (

          <div

            key={school.schoolId}

            className="rounded-xl border border-brand-100 p-5 hover:shadow-md transition"

          >

            <div className="flex justify-between">

              <div>

                <h3 className="font-semibold">

                  {school.schoolName}

                </h3>

                <p className="text-sm text-brand-500">

                  {school.city}

                </p>

              </div>

              <TrendingUp className="text-green-600"/>

            </div>

            <div className="mt-5 grid grid-cols-3 gap-4 text-center">

              <div>

                <p className="text-xs text-brand-500">

                  Commandes

                </p>

                <p className="font-bold">

                  {school.orders}

                </p>

              </div>

              <div>

                <p className="text-xs text-brand-500">

                  Panier moyen

                </p>

                <p className="font-bold">

                  {formatMAD(school.averageCart)}

                </p>

              </div>

              <div>

                <p className="text-xs text-brand-500">

                  Chiffre d'affaires

                </p>

                <p className="font-bold">

                  {formatMAD(school.revenue)}

                </p>

              </div>

            </div>

          </div>

        ))}

      </div>

    </Card>

  );

}