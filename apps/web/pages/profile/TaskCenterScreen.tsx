
import React, { useState } from 'react';
import PageLayout from '../../components/PageLayout';
import { useTheme } from '../../context/ThemeContext';
import { CheckCircle, Gift, ArrowRight, Trophy, Clock } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

interface Task {
    id: string;
    title: string;
    description: string;
    reward: string;
    progress: number; // 0 to 100
    status: 'pending' | 'claimable' | 'completed';
    actionLabel: string;
    dueDate?: string;
}

const TaskCenterScreen: React.FC = () => {
    const { primaryColor } = useTheme();
    const { addNotification } = useNotifications();

    const [tasks, setTasks] = useState<Task[]>([
        { id: '1', title: 'Complete KYC Verification', description: 'Verify your identity to unlock all features.', reward: '5 USDT Voucher', progress: 100, status: 'claimable', actionLabel: 'Verify', dueDate: '2023-12-31' },
        { id: '2', title: 'First Deposit', description: 'Deposit at least $50 via P2P or Bank Transfer.', reward: '10 USDT Cashback', progress: 0, status: 'pending', actionLabel: 'Deposit', dueDate: '2023-11-30' },
        { id: '3', title: 'Make Your First Trade', description: 'Complete a Spot or Swap trade of any amount.', reward: '20 Points', progress: 50, status: 'pending', actionLabel: 'Trade', dueDate: '2023-11-15' },
        { id: '4', title: 'Refer a Friend', description: 'Invite a friend who completes KYC.', reward: '500 Points', progress: 0, status: 'pending', actionLabel: 'Invite', dueDate: '2024-01-20' },
    ]);

    const handleClaim = (id: string) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'completed' } : t));
        addNotification({
            icon: 'success',
            title: 'Reward Claimed!',
            message: 'Reward successfully added to your account.'
        });
    };

    return (
        <PageLayout title="Task Center" noPadding>
            <div className="flex flex-col h-full bg-background-primary">
                {/* Hero Header */}
                <div className="bg-background-secondary p-6 pb-10 border-b border-border-divider relative overflow-hidden">
                    <div className={`absolute top-0 right-0 w-40 h-40 bg-${primaryColor}/10 rounded-full blur-3xl -mr-10 -mt-10`}></div>
                    <div className="relative z-10">
                        <h1 className="text-2xl font-black text-text-primary mb-1">Earn Rewards</h1>
                        <p className="text-sm text-text-secondary">Complete tasks to win vouchers and points.</p>
                    </div>
                    <div className="mt-6 flex gap-4">
                        <div className="flex-1 bg-background-tertiary/50 p-3 rounded-xl border border-border-divider/50 backdrop-blur-md">
                            <p className="text-xs text-text-secondary uppercase font-bold">Points Balance</p>
                            <p className={`text-2xl font-black text-${primaryColor}`}>150</p>
                        </div>
                        <div className="flex-1 bg-background-tertiary/50 p-3 rounded-xl border border-border-divider/50 backdrop-blur-md">
                            <p className="text-xs text-text-secondary uppercase font-bold">Tasks Done</p>
                            <p className="text-2xl font-black text-text-primary">1/5</p>
                        </div>
                    </div>
                </div>

                {/* Task List */}
                <div className="flex-grow overflow-y-auto p-4 space-y-4 -mt-4">
                    {tasks.map(task => (
                        <div key={task.id} className="bg-background-secondary p-4 rounded-xl border border-border-divider shadow-sm relative overflow-hidden">
                            {task.status === 'completed' && (
                                <div className="absolute top-0 right-0 bg-success text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                                    COMPLETED
                                </div>
                            )}
                            
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold text-text-primary">{task.title}</h3>
                                    <div className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-${primaryColor}/10 text-${primaryColor}`}>
                                        <Gift className="w-3 h-3" />
                                        {task.reward}
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-background-tertiary flex items-center justify-center">
                                    <Trophy className={`w-5 h-5 ${task.status === 'completed' ? 'text-success' : 'text-text-secondary'}`} />
                                </div>
                            </div>
                            
                            <p className="text-xs text-text-secondary mb-3 leading-relaxed">{task.description}</p>

                            {task.dueDate && (
                                <div className="flex items-center gap-1.5 mb-3 text-[10px] font-medium text-text-secondary bg-background-tertiary/50 px-2 py-1 rounded w-fit">
                                    <Clock className="w-3 h-3" />
                                    <span>Due {task.dueDate}</span>
                                </div>
                            )}

                            {/* Progress Bar */}
                            <div className="w-full h-1.5 bg-background-tertiary rounded-full overflow-hidden mb-4">
                                <div 
                                    className={`h-full rounded-full transition-all duration-500 ${task.status === 'completed' ? 'bg-success' : `bg-${primaryColor}`}`} 
                                    style={{ width: `${task.progress}%` }}
                                ></div>
                            </div>

                            {/* Action */}
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-text-secondary font-medium">Progress: {task.progress}%</span>
                                {task.status === 'claimable' ? (
                                    <button 
                                        onClick={() => handleClaim(task.id)}
                                        className={`px-6 py-2 rounded-lg font-bold text-sm bg-${primaryColor} text-background-primary hover:brightness-110 transition-all shadow-lg active:scale-95`}
                                    >
                                        Claim Reward
                                    </button>
                                ) : task.status === 'completed' ? (
                                    <button disabled className="px-6 py-2 rounded-lg font-bold text-sm bg-background-tertiary text-text-secondary cursor-default flex items-center gap-1">
                                        <CheckCircle className="w-4 h-4" /> Done
                                    </button>
                                ) : (
                                    <button className="px-6 py-2 rounded-lg font-bold text-sm bg-background-tertiary text-text-primary hover:bg-border-divider transition-all flex items-center gap-1 group">
                                        {task.actionLabel} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </PageLayout>
    );
};

export default TaskCenterScreen;
