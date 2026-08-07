import { Search } from 'lucide-react';

import { Card } from '../ui';

interface SearchItem{

keyword:string;

count:number;

}

interface Props{

data:SearchItem[];

}

export function SearchAnalytics({

data

}:Props){

const max=Math.max(

...data.map(x=>x.count),

1

);

return(

<Card>

<div className="mb-6 flex items-center gap-3">

<Search/>

<h2 className="text-xl font-bold">

Recherches populaires

</h2>

</div>

<div className="space-y-5">

{data.map(item=>(

<div key={item.keyword}>

<div className="mb-2 flex justify-between">

<p>

{item.keyword}

</p>

<p className="font-bold">

{item.count}

</p>

</div>

<div className="h-2 rounded-full bg-brand-100 overflow-hidden">

<div

className="h-full rounded-full bg-brand-600"

style={{

width:`${item.count/max*100}%`

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