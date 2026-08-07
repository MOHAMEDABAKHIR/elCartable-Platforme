import { Card } from '../ui';

interface Activity {
  id: string;
  action: string;
  orderNumber: string;
  user: string;
  createdAt: string;
}

interface ActivityTimelineProps {
  activities: Activity[];
}

export function ActivityTimeline({
  activities,
}: ActivityTimelineProps) {

  return (
    <Card>

      <h2 className="mb-5 text-lg font-bold text-brand-900">
        Activités récentes
      </h2>


      {activities.length === 0 ? (

        <p className="text-sm text-brand-500">
          Aucune activité récente.
        </p>

      ) : (

        <div className="space-y-5">

          {activities.map((activity) => (

            <div
              key={activity.id}
              className="flex gap-4"
            >

              <div className="mt-1 h-3 w-3 rounded-full bg-brand-500" />


              <div className="flex-1">

                <p className="font-medium text-brand-900">

                  {activity.action}

                  {activity.orderNumber && (
                    <>
                      {' '}
                      sur la commande{' '}
                      <span className="font-bold">
                        {activity.orderNumber}
                      </span>
                    </>
                  )}

                </p>


                <div className="mt-1 flex gap-3 text-xs text-brand-500">

                  <span>
                    {activity.user}
                  </span>


                  <span>
                    {new Date(activity.createdAt).toLocaleString('fr-FR')}
                  </span>

                </div>

              </div>

            </div>

          ))}

        </div>

      )}

    </Card>
  );
}