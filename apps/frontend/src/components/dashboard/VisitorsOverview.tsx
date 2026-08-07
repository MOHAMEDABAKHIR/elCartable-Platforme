import {

Globe,

Users,

Monitor,

Smartphone,

Clock3,

TrendingUp

} from 'lucide-react';

import { Card } from '../ui';

interface Props{

sessions:number;

visitors:number;

averageDuration:number;

bounceRate:number;

}

function Item({

icon,

label,

value

}:{

icon:React.ReactNode;

label:string;

value:string|number;

}){

return(

<div className="rounded-xl border border-brand-100 p-5">

<div className="mb-3">

{icon}

</div>

<p className="text-sm text-brand-500">

{label}

</p>

<p className="mt-2 text-2xl font-bold">

{value}

</p>

</div>

);

}

export function VisitorsOverview({

sessions,

visitors,

averageDuration,

bounceRate

}:Props){

return(

<Card>

<h2 className="mb-6 text-xl font-bold">

Analyse visiteurs

</h2>

<div className="grid gap-4 sm:grid-cols-2">

<Item

icon={<Users/>}

label="Visiteurs"

value={visitors}

/>

<Item

icon={<Globe/>}

label="Sessions"

value={sessions}

/>

<Item

icon={<Clock3/>}

label="Durée moyenne"

value={`${averageDuration}s`}

/>

<Item

icon={<TrendingUp/>}

label="Taux de rebond"

value={`${bounceRate}%`}

/>

</div>

</Card>

);

}