
import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface SwapChartProps {
    fromAssetSymbol: string;
    toAssetSymbol: string;
    rate: number;
}

export const SwapChart: React.FC<SwapChartProps> = ({ fromAssetSymbol, toAssetSymbol, rate }) => {
    const { primaryColor } = useTheme();
    const { t } = useLanguage();

    const chartData = useMemo(() => {
        const data = [];
        let currentPrice = rate;
        for (let i = 23; i >= 0; i--) {
            // Generate some random-walk mock data based on the current rate
            const fluctuation = (Math.random() - 0.5) * (currentPrice * 0.02);
            currentPrice += fluctuation;
            data.push({
                name: `${i}h ago`,
                value: Math.max(0, currentPrice) // Ensure price doesn't go below zero
            });
        }
        data.push({ name: 'Now', value: rate }); // Add the current, real rate
        return data.reverse();
    }, [rate]);

    const chartColor = primaryColor === 'brand-yellow' ? '#F0B90B' : '#0ECB81';

    return (
        <div className="space-y-3 w-full overflow-hidden">
             <h2 className="text-lg font-bold text-text-primary">{t('price_chart')}</h2>
             <div className="bg-background-secondary rounded-xl p-4 h-48 w-full" dir="ltr">
                 <div className="text-xs text-text-secondary mb-2">{fromAssetSymbol} / {toAssetSymbol} - {t('last_24_hours')}</div>
                <ResponsiveContainer width="100%" height="85%" minWidth={0} minHeight={0}>
                    <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <defs>
                            <linearGradient id="chartColor" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={chartColor} stopOpacity={0.8}/>
                                <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="#848E9C" fontSize={10} tickLine={false} axisLine={false} interval={5} />
                        <YAxis stroke="#848E9C" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => (value as number).toFixed(5)} domain={['dataMin', 'dataMax']} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#2B3139',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#FEFEFE',
                                fontSize: '12px',
                                padding: '8px'
                            }}
                            itemStyle={{ color: '#FEFEFE' }}
                            labelStyle={{ display: 'none' }}
                            formatter={(value) => [`${(value as number).toFixed(6)} ${toAssetSymbol}`, fromAssetSymbol]}
                        />
                        <Area type="monotone" dataKey="value" stroke={chartColor} fillOpacity={1} fill="url(#chartColor)" strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
