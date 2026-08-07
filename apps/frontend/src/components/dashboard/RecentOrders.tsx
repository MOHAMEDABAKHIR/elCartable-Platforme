import { Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge, Card } from '../ui';

import {
  ORDER_STATUS_LABELS,
  formatMAD,
  orderStatusColor,
} from '../../lib/format';

import type { OrderStatus } from '../../lib/types';

interface RecentOrder {

  id:string;

  orderNumber:string;

  customerName:string;

  school?:string;

  city?:string;

  status:OrderStatus;

  total:number;

  createdAt:string;

}

interface Props{

  data:RecentOrder[];

}

function initials(name:string){

  return name
    .split(' ')
    .slice(0,2)
    .map((x)=>x[0])
    .join('')
    .toUpperCase();

}

export function RecentOrders({

  data

}:Props){

return(

<Card>

<div className="mb-6 flex items-center justify-between">

<div>

<h2 className="text-xl font-bold text-brand-900">

Dernières commandes

</h2>

<p className="text-sm text-brand-500">

Les commandes les plus récentes

</p>

</div>

</div>

<div className="overflow-x-auto">

<table className="min-w-full">

<thead>

<tr className="border-b border-brand-100 text-left text-sm text-brand-500">

<th className="pb-3">

Client

</th>

<th>

Commande

</th>

<th>

Statut

</th>

<th>

Montant

</th>

<th>

Date

</th>

<th></th>

</tr>

</thead>

<tbody>

{data.map((order)=>(

<tr
key={order.id}
className="border-b border-brand-50 transition hover:bg-brand-50"
>

<td className="py-4">

<div className="flex items-center gap-3">

<div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700">

{initials(order.customerName)}

</div>

<div>

<p className="font-semibold">

{order.customerName}

</p>

{order.school && (

<p className="text-xs text-brand-500">

{order.school}

</p>

)}

</div>

</div>

</td>

<td>

<div>

<p className="font-semibold">

{order.orderNumber}

</p>

{order.city && (

<p className="text-xs text-brand-500">

{order.city}

</p>

)}

</div>

</td>

<td>

<Badge

className={orderStatusColor(order.status)}

>

{ORDER_STATUS_LABELS[order.status]}

</Badge>

</td>

<td className="font-bold">

{formatMAD(order.total)}

</td>

<td className="text-sm text-brand-500">

{new Date(order.createdAt).toLocaleDateString('fr-FR')}

</td>

<td>

<Link

to={`/admin/orders/${order.id}`}

className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-brand-100"

>

<Eye size={18}/>

</Link>

</td>

</tr>

))}

</tbody>

</table>

</div>

</Card>

);

}