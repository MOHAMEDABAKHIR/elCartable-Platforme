import {

Bell,

Calendar,

RefreshCw

} from 'lucide-react';

import { Button } from '../ui';

interface Props{

user:string;

}

export function DashboardHeader({

user

}:Props){

const today=new Date().toLocaleDateString(

'fr-FR',

{

weekday:'long',

day:'numeric',

month:'long',

year:'numeric'

}

);

return(

<div className="flex flex-wrap items-center justify-between gap-5">

<div>

<h1 className="text-3xl font-extrabold">

Bonjour {user} 👋

</h1>

<p className="mt-2 text-brand-500">

{today}

</p>

</div>

<div className="flex items-center gap-3">

<Button

variant="outline"

>

<RefreshCw

size={18}

/>

</Button>

<Button

variant="outline"

>

<Calendar

size={18}

/>

</Button>

<Button

variant="outline"

>

<Bell

size={18}

/>

</Button>

</div>

</div>

);

}