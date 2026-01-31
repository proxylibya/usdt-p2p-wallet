
import React from 'react';
import { DashboardStat } from '../../types';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  stat: DashboardStat;
}

export const StatCard: React.FC<StatCardProps> = ({ stat }) => {
    const isIncrease = stat.changeType === 'increase';
    return (
        <div className="bg-background-secondary p-6 rounded-lg">
            <p className="text-sm font-medium text-text-secondary">{stat.title}</p>
            <div className="mt-2 flex items-baseline justify-between">
                <p className="text-3xl font-bold text-text-primary">{stat.value}</p>
                <div className={`flex items-center text-sm font-semibold ${isIncrease ? 'text-success' : 'text-error'}`}>
                    {isIncrease ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    <span>{stat.change}</span>
                </div>
            </div>
        </div>
    );
};
