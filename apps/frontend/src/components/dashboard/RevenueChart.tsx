import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card } from '../ui';

import { formatMAD } from '../../lib/format';

interface RevenuePoint {

  date:string;

  revenue:number;

  orders:number;

}

interface RevenueChartProps{

    data:RevenuePoint[];

}

export function RevenueChart({

    data

}:RevenueChartProps){

    return(

<Card>

<div className="mb-6">

<h2 className="text-xl font-bold text-brand-900">

Evolution du chiffre d'affaires

</h2>

<p className="text-sm text-brand-500">

7 derniers jours

</p>

</div>

<div className="h-96">

<ResponsiveContainer>

<AreaChart data={data}>

<CartesianGrid strokeDasharray="3 3"/>

<XAxis dataKey="date"/>

<YAxis/>

<Tooltip

formatter={(value:number)=>formatMAD(value)}

labelFormatter={(label)=>`Jour : ${label}`}

/>

<Area

type="monotone"

dataKey="revenue"

stroke="#7C3AED"

fill="#DDD6FE"

strokeWidth={3}

/>

</AreaChart>

</ResponsiveContainer>

</div>

</Card>

    );

}