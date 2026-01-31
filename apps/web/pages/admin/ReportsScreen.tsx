import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

const userActivityData = [
    { name: 'Mon', active: 400 },
    { name: 'Tue', active: 300 },
    { name: 'Wed', active: 500 },
    { name: 'Thu', active: 280 },
    { name: 'Fri', active: 450 },
    { name: 'Sat', active: 600 },
    { name: 'Sun', active: 550 },
];

const revenueData = [
  { name: 'Jan', revenue: 4000 },
  { name: 'Feb', revenue: 3000 },
  { name: 'Mar', revenue: 5000 },
  { name: 'Apr', revenue: 4500 },
  { name: 'May', revenue: 6000 },
  { name: 'Jun', revenue: 5500 },
];

const p2pVolumeData = [
  { name: 'USDT', value: 40000 },
  { name: 'BTC', value: 30000 },
  { name: 'ETH', value: 20000 },
  { name: 'USDC', value: 15000 },
];
const COLORS = ['#0ECB81', '#F7931A', '#627EEA', '#2775CA'];

const ReportsScreen: React.FC = () => {
    const { t } = useLanguage();

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-text-primary">{t('reports')}</h1>
                <p className="text-text-secondary mt-1">{t('reports_screen_subtitle')}</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ReportCard title={t('new_user_registrations')}>
                     <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={userActivityData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" />
                            <XAxis dataKey="name" stroke="#848E9C" />
                            <YAxis stroke="#848E9C" />
                            <Tooltip contentStyle={{ backgroundColor: '#2B3139', border: 'none' }} />
                            <Legend />
                            <Line type="monotone" dataKey="active" name={t('active_users')} stroke="#F0B90B" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </ReportCard>
                 <ReportCard title={t('revenue_by_month')}>
                     <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" />
                            <XAxis dataKey="name" stroke="#848E9C" />
                            <YAxis stroke="#848E9C" tickFormatter={(value) => `$${value/1000}k`} />
                            <Tooltip contentStyle={{ backgroundColor: '#2B3139', border: 'none' }} formatter={(value) => `$${Number(value).toLocaleString()}`} />
                            <Legend />
                            <Line type="monotone" dataKey="revenue" name={t('revenue')} stroke="#0ECB81" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </ReportCard>
                 <ReportCard title={t('p2p_trade_volume')}>
                     <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={p2pVolumeData} cx="50%" cy="50%" labelLine={false} outerRadius={120} fill="#8884d8" dataKey="value" nameKey="name" label={(entry) => entry.name}>
                                {p2pVolumeData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                             <Tooltip contentStyle={{ backgroundColor: '#2B3139', border: 'none' }} formatter={(value) => `$${Number(value).toLocaleString()}`} />
                             <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </ReportCard>
            </div>
        </div>
    );
};

const ReportCard: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => {
    const { t } = useLanguage();
    return (
        <div className="bg-background-secondary p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-bold text-text-primary">{title}</h2>
                 <button className="text-sm font-semibold bg-background-tertiary px-3 py-1.5 rounded-md text-text-primary hover:bg-border-divider">{t('generate_report')}</button>
            </div>
            {children}
        </div>
    );
};

export default ReportsScreen;
