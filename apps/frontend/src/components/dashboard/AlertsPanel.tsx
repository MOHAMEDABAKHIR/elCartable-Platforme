import {

AlertTriangle,

Package,

Phone,

ShoppingCart,

XCircle

} from 'lucide-react';

import { Card } from '../ui';

interface AlertItem{

title:string;

value:number;

color:string;

icon:React.ReactNode;

}

interface Props{

awaitingCall:number;

cancelled:number;

lowStock:number;

abandonedCarts:number;

}

export function AlertsPanel({

awaitingCall,

cancelled,

lowStock,

abandonedCarts

}:Props){

const alerts:AlertItem[]=[

{

title:'Commandes à appeler',

value:awaitingCall,

icon:<Phone size={18}/>,

color:'bg-yellow-100 text-yellow-700'

},

{

title:'Commandes annulées',

value:cancelled,

icon:<XCircle size={18}/>,

color:'bg-red-100 text-red-700'

},

{

title:'Stock faible',

value:lowStock,

icon:<Package size={18}/>,

color:'bg-orange-100 text-orange-700'

},

{

title:'Paniers abandonnés',

value:abandonedCarts,

icon:<ShoppingCart size={18}/>,

color:'bg-blue-100 text-blue-700'

}

];

return(

<Card>

<div className="mb-6 flex items-center gap-3">

<AlertTriangle className="text-orange-500"/>

<h2 className="text-xl font-bold">

Alertes

</h2>

</div>

<div className="space-y-4">

{alerts.map((alert)=>(

<div

key={alert.title}

className="flex items-center justify-between rounded-xl border border-brand-100 p-4"

>

<div className="flex items-center gap-3">

<div className={`rounded-xl p-3 ${alert.color}`}>

{alert.icon}

</div>

<span className="font-medium">

{alert.title}

</span>

</div>

<span className="text-2xl font-bold">

{alert.value}

</span>

</div>

))}

</div>

</Card>

);

}