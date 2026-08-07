import {

LineChart,

ResponsiveContainer,

Line

} from 'recharts';

interface Props{

data:number[];

}

export function MiniSparkline({

data

}:Props){

const values=data.map(v=>({

value:v

}));

return(

<div className="h-12">

<ResponsiveContainer>

<LineChart data={values}>

<Line

type="monotone"

dataKey="value"

strokeWidth={3}

dot={false}

isAnimationActive

/>

</LineChart>

</ResponsiveContainer>

</div>

);

}