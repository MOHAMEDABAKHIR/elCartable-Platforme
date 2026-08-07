import { Card } from '../ui';

interface Props {

  visitors:number;

  productViews:number;

  addToCart:number;

  checkout:number;

  orders:number;

}

export function ConversionFunnel({

  visitors,

  productViews,

  addToCart,

  checkout,

  orders,

}:Props){

const steps=[

{
label:'Visiteurs',
value:visitors
},

{
label:'Produits consultés',
value:productViews
},

{
label:'Ajout panier',
value:addToCart
},

{
label:'Checkout',
value:checkout
},

{
label:'Commandes',
value:orders
}

];

return(

<Card>

<div className="mb-8">

<h2 className="text-xl font-bold">

Entonnoir de conversion

</h2>

<p className="text-sm text-brand-500">

Suivez où les visiteurs quittent votre plateforme.

</p>

</div>

<div className="space-y-5">

{steps.map((step,index)=>{

const previous=index===0
?step.value
:steps[index-1].value;

const rate=
index===0
?100
:Math.round((step.value/previous)*100);

return(

<div key={step.label}>

<div className="mb-2 flex justify-between">

<div>

<p className="font-semibold">

{step.label}

</p>

<p className="text-xs text-brand-500">

{step.value.toLocaleString()} utilisateurs

</p>

</div>

<div className="text-right">

<p className="font-bold">

{rate}%

</p>

</div>

</div>

<div className="h-4 overflow-hidden rounded-full bg-brand-100">

<div

className="h-full rounded-full bg-brand-600 transition-all duration-500"

style={{

width:`${rate}%`

}}

>

</div>

</div>

</div>

);

})}

</div>

</Card>

);

}