
import React, { useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';
import { StatCard } from '../../components/admin/StatCard';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';
import { DashboardStat } from '../../types';
import { useLiveData } from '../../context/LiveDataContext';

const DashboardScreen: React.FC = () => {
    const { t } = useLanguage();
    const { formatCurrency } = useCurrency();
    const { transactions, p2pOffers, activeTrades } = useLiveData();

    // Live Stats Calculation
    const stats = useMemo(() => {
        // Total Volume: Sum of all transactions (absolute value of USD)
        const totalTxVolume = transactions.reduce((acc, tx) => acc + Math.abs(tx.usdValue), 0);
        
        // P2P Volume: Sum of all completed P2P trade amounts
        const p2pVolume = activeTrades
            .filter(t => t.status === 'Completed')
            .reduce((acc, t) => acc + t.fiatAmount, 0); 

        // Revenue: Platform fee (0.1% of transaction volume)
        const revenue = totalTxVolume * 0.001;

        // Active Offers
        const activeAds = p2pOffers.filter(o => o.isActive).length;

        // Dynamic Chart Data Generation based on Transaction History
        const chartDataMap = new Map<string, { volume: number, count: number }>();
        const today = new Date();
        
        // Seed last 7 days with 0 to ensure full graph
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            chartDataMap.set(key, { volume: 0, count: 0 });
        }

        transactions.forEach(tx => {
            const date = new Date(tx.date);
            const key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (chartDataMap.has(key)) {
                const entry = chartDataMap.get(key)!;
                entry.volume += Math.abs(tx.usdValue);
                entry.count += 1;
            }
        });

        // Convert Map to Array for Recharts
        const chartData = Array.from(chartDataMap.entries()).map(([name, data]) => ({
            name,
            volume: data.volume,
            // Mocking "users" count loosely based on transaction count for visual demo
            users: data.count * 5 + Math.floor(Math.random() * 20) 
        }));

        return {
            totalTxVolume,
            p2pVolume,
            revenue,
            activeAds,
            userCount: 14284 + Math.floor(transactions.length / 2),
            chartData
        };
    }, [transactions, activeTrades, p2pOffers]);

    const dashboardStats: DashboardStat[] = [
        { title: t('total_users'), value: stats.userCount.toLocaleString(), change: '+12.5%', changeType: 'increase' },
        { title: t('trading_volume'), value: formatCurrency(stats.p2pVolume + 1200000), change: '+8.2%', changeType: 'increase' }, // Base + Live
        { title: t('total_transaction_volume'), value: formatCurrency(stats.totalTxVolume), change: '+5.5%', changeType: 'increase' },
        { title: t('total_revenue'), value: formatCurrency(stats.revenue + 89000), change: '-1.4%', changeType: 'decrease' },
        { title: 'Active P2P Ads', value: stats.activeAds.toString(), change: '+5', changeType: 'increase' },
    ];

    return (
        <div className="space-y-8 animate-fadeIn">
            <div>
                <h1 className="text-3xl font-bold text-text-primary">{t('dashboard')}</h1>
                <p className="text-text-secondary mt-1">{t('welcome_admin')} (Live Data Connected)</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {dashboardStats.map((stat) => (
                    <StatCard key={stat.title} stat={stat} />
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-background-secondary p-6 rounded-lg">
                    <h2 className="text-xl font-bold text-text-primary mb-4">{t('user_growth')}</h2>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#F0B90B" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#F0B90B" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#848E9C" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#848E9C" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#2B3139', border: 'none', borderRadius: '8px' }}/>
                                <Area type="monotone" dataKey="users" stroke="#F0B90B" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                 <div className="bg-background-secondary p-6 rounded-lg">
                    <h2 className="text-xl font-bold text-text-primary mb-4">{t('transaction_volume')} (Last 7 Days)</h2>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                             <BarChart data={stats.chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <XAxis dataKey="name" stroke="#848E9C" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#848E9C" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(Number(value)).replace(/(\.00|,00)/, '')} />
                                <Tooltip contentStyle={{ backgroundColor: '#2B3139', border: 'none', borderRadius: '8px' }} cursor={{fill: 'rgba(132, 142, 156, 0.1)'}} formatter={(value) => [formatCurrency(Number(value)), 'Volume']} />
                                <Bar dataKey="volume" fill="#0ECB81" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default DashboardScreen;
