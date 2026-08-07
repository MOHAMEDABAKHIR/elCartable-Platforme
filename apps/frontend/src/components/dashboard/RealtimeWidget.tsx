import {

Activity,

ShoppingCart,

CreditCard,

Users

} from 'lucide-react';

import { Card } from '../ui';

interface Props{

online:number;

activeCart:number;

checkout:number;

ordersToday:number;

}

function Item({

icon,

title,

value,

color

}:{

icon:React.ReactNode;

title:string;

value:number;

color:string;

}){

return(

<div className="rounded-xl border border-brand-100 p-4">

<div className={`mb-3 inline-flex rounded-xl p-3 ${color}`}>

{icon}

</div>

<p className="text-sm text-brand-500">

{title}

</p>

<p className="mt-2 text-3xl font-bold">

{value}

</p>

</div>

);

}

export function RealtimeWidget({

online,

activeCart,

checkout,

ordersToday

}:Props){

return(

<Card>

<div className="mb-6 flex items-center gap-3">

<Activity className="text-green-600"/>

<h2 className="text-xl font-bold">

Temps réel

</h2>

<div className="ml-auto flex items-center gap-2">

<div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"/>

<span className="text-sm">

En direct

</span>

</div>

</div>

<div className="grid gap-4 sm:grid-cols-2">

<Item

icon={<Users/>}

title="En ligne"

value={online}

color="bg-green-100 text-green-700"

/>

<Item

icon={<ShoppingCart/>}

title="Paniers"

value={activeCart}

color="bg-blue-100 text-blue-700"

/>

<Item

icon={<CreditCard/>}

title="Checkout"

value={checkout}

color="bg-orange-100 text-orange-700"

/>

<Item

icon={<Activity/>}

title="Commandes aujourd'hui"

value={ordersToday}

color="bg-purple-100 text-purple-700"

/>

</div>

</Card>

);

}