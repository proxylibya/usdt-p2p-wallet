
import React from 'react';
import { ResponsiveContainer, ComposedChart, XAxis, YAxis, Tooltip, Bar, ReferenceLine, Area, Label } from 'recharts';
import { useTheme } from '../context/ThemeContext';

interface LiveCandleChartProps {
    data: any[]; 
    symbol: string;
}

export const LiveCandleChart: React.FC<LiveCandleChartProps> = ({ data, symbol }) => {
    const { primaryColor } = useTheme();
    const chartColor = primaryColor === 'brand-yellow' ? '#F0B90B' : '#0ECB81';

    return (
        <div className="w-full h-full select-none">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data}>
                    <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <XAxis 
                        dataKey="time" 
                        stroke="#848E9C" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                        minTickGap={30}
                    />
                    <YAxis 
                        domain={['auto', 'auto']} 
                        orientation="right" 
                        stroke="#848E9C" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(val) => val.toFixed(2)}
                        width={40}
                    />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1E2026', border: '1px solid #2B3139', borderRadius: '8px' }}
                        itemStyle={{ color: '#FEFEFE' }}
                        labelStyle={{ color: '#848E9C' }}
                    />
                    <ReferenceLine y={data[data.length - 1]?.price} stroke={chartColor} strokeDasharray="3 3" opacity={0.5} />
                    <Bar dataKey="vol" yAxisId={0} fill="#2B3139" opacity={0.3} barSize={2} />
                    <Area 
                        type="monotone" 
                        dataKey="price" 
                        stroke={chartColor} 
                        fillOpacity={1} 
                        fill="url(#colorPrice)" 
                        strokeWidth={2}
                        animationDuration={500}
                    />
                    {data.length > 0 && (
                        <ReferenceLine x={data[data.length - 1].time} stroke="none">
                            <Label content={() => <circle cx="0" cy="0" r="4" fill={chartColor} className="animate-ping" />} /> 
                        </ReferenceLine>
                    )}
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};
