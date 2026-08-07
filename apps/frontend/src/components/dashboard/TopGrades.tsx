import { BookOpen } from 'lucide-react';

import { Card } from '../ui';

interface GradeItem{

grade:string;

orders:number;

}

interface Props{

data:GradeItem[];

}

export function TopGrades({

data

}:Props){

const max=Math.max(

...data.map(g=>g.orders),

1

);

return(

<Card>

<div className="mb-6 flex items-center gap-3">

<BookOpen/>

<h2 className="text-xl font-bold">

Niveaux les plus demandés

</h2>

</div>

<div className="space-y-4">

{data.map((grade)=>(

<div key={grade.grade}>

<div className="mb-2 flex justify-between">

<p>

{grade.grade}

</p>

<p className="font-bold">

{grade.orders}

</p>

</div>

<div className="h-2 rounded-full bg-brand-100 overflow-hidden">

<div

className="h-full rounded-full bg-indigo-600"

style={{

width:`${grade.orders/max*100}%`

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