import { MapPin } from 'lucide-react';

import { Card } from '../ui';

interface City{

name:string;

orders:number;

revenue:number;

}

interface Props{

data:City[];

}

export function TopCities({

data

}:Props){

const max=Math.max(...data.map(x=>x.orders),1);

return(

<Card>

<div className="mb-6 flex items-center gap-2">

<MapPin className="text-brand-600"/>

<h2 className="text-xl font-bold">

Top villes

</h2>

</div>

<div className="space-y-5">

{data.map(city=>(

<div key={city.name}>

<div className="mb-2 flex justify-between">

<div>

<p className="font-semibold">

{city.name}

</p>

<p className="text-xs text-brand-500">

{city.revenue.toLocaleString()} DH

</p>

</div>

<p className="font-bold">

{city.orders}

</p>

</div>

<div className="h-2 overflow-hidden rounded-full bg-brand-100">

<div

className="h-full rounded-full bg-brand-600"

style={{

width:`${city.orders/max*100}%`

}}

>

</div>

</div>

</div>

))}

</div>

</Card>

);

}