
import React, { useState } from 'react';
import PageLayout from '../../components/PageLayout';
import { useTheme } from '../../context/ThemeContext';
import { ShieldCheck, Smartphone, Globe, AlertTriangle, ShieldAlert, Clock, MapPin, Monitor } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

const AccountActivityScreen: React.FC = () => {
    const { primaryColor } = useTheme();
    const { addNotification } = useNotifications();

    const [activityLogs, setActivityLogs] = useState([
        { id: 1, action: 'Login Successful', device: 'iPhone 14 Pro', ip: '192.168.1.105', location: 'Tripoli, Libya', date: '2023-10-27 10:45 AM', status: 'success', current: true },
        { id: 2, action: 'Password Changed', device: 'Web Browser', ip: '192.168.1.105', location: 'Tripoli, Libya', date: '2023-10-26 09:15 PM', status: 'success', current: false },
        { id: 3, action: 'Failed Login Attempt', device: 'Unknown Device', ip: '102.15.22.11', location: 'Benghazi, Libya', date: '2023-10-25 03:30 AM', status: 'failed', current: false },
        { id: 4, action: '2FA Enabled', device: 'iPhone 14 Pro', ip: '192.168.1.105', location: 'Tripoli, Libya', date: '2023-10-24 05:20 PM', status: 'success', current: false },
    ]);

    const handleLogOutAll = () => {
        if (window.confirm("Are you sure? This will clear logs and log out other sessions.")) {
            // Keep only current session logs and clear others
            setActivityLogs(prev => prev.filter(log => log.current));
            addNotification({ icon: 'success', title: 'Security', message: 'Other sessions terminated.' });
        }
    };

    return (
        <PageLayout title="Account Activity" scrollable={false}>
            <div className="flex flex-col h-full bg-background-primary">
                {/* Scrollable List Area */}
                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                    {activityLogs.length > 0 ? activityLogs.map(log => (
                        <div key={log.id} className="bg-background-secondary p-4 rounded-xl border border-border-divider shadow-sm hover:bg-background-tertiary/20 transition-colors">
                            {/* Header: Action & Status Icon */}
                            <div className="flex items-center gap-4 mb-3">
                                <div className={`p-3 rounded-full flex-shrink-0 border ${log.status === 'success' ? 'bg-success/10 text-success border-success/20' : 'bg-error/10 text-error border-error/20'}`}>
                                    {log.status === 'success' ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                                </div>
                                <div className="flex-grow">
                                    <div className="flex justify-between items-start">
                                        <p className="font-bold text-text-primary text-sm">{log.action}</p>
                                        {log.current && (
                                            <span className={`text-[10px] bg-${primaryColor}/10 text-${primaryColor} px-2 py-0.5 rounded font-bold uppercase tracking-wider`}>
                                                Current
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-text-secondary mt-0.5 flex items-center gap-1.5">
                                        <Clock className="w-3 h-3" />
                                        {log.date}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Details Grid */}
                            <div className="flex flex-col gap-2 text-xs text-text-secondary bg-background-tertiary/30 p-3 rounded-lg border border-border-divider/30">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {log.device.includes('iPhone') || log.device.includes('Samsung') ? <Smartphone className="w-3.5 h-3.5 opacity-70" /> : <Monitor className="w-3.5 h-3.5 opacity-70" />}
                                        <span className="truncate max-w-[150px]">{log.device}</span>
                                    </div>
                                    <div className="flex items-center gap-2 font-mono">
                                        <Globe className="w-3.5 h-3.5 opacity-70" />
                                        <span>{log.ip}</span>
                                    </div>
                                </div>
                                <div className="w-full h-px bg-border-divider/20"></div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5 opacity-70" />
                                    <span>{log.location}</span>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="flex flex-col items-center justify-center py-20 text-text-secondary h-full opacity-50">
                            <ShieldAlert className="w-16 h-16 mb-4 opacity-50" />
                            <p>No activity logs found.</p>
                        </div>
                    )}
                </div>
                
                {/* Fixed Footer */}
                <div className="p-4 pb-8 bg-background-primary border-t border-border-divider/50 z-10 space-y-4 shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
                    <div className="text-center space-y-1">
                        <p className="text-[10px] text-text-secondary uppercase tracking-wide">
                            Showing last 30 days
                        </p>
                        <p className="text-xs text-text-secondary">
                            Suspicious activity? <span className={`text-${primaryColor} font-bold cursor-pointer hover:underline`}>Change Password</span>
                        </p>
                    </div>
                    <button 
                        onClick={handleLogOutAll}
                        className="w-full py-4 rounded-xl border border-error/50 text-error font-bold text-sm hover:bg-error/5 transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                        <ShieldAlert className="w-5 h-5" />
                        Clear Logs & Secure Account
                    </button>
                </div>
            </div>
        </PageLayout>
    );
};

export default AccountActivityScreen;
