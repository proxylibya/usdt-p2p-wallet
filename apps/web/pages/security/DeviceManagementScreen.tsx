
import React, { useState } from 'react';
import PageLayout from '../../components/PageLayout';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { Smartphone, Laptop, Trash2, Globe, Clock, ShieldAlert, Monitor } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

const DeviceManagementScreen: React.FC = () => {
    const { t } = useLanguage();
    const { primaryColor } = useTheme();
    const { addNotification } = useNotifications();

    const [devices, setDevices] = useState([
        { id: 1, name: 'iPhone 14 Pro', type: 'mobile', location: 'Tripoli, Libya', ip: '192.168.1.105', active: 'Now', isCurrent: true },
        { id: 2, name: 'Chrome on Windows', type: 'desktop', location: 'Benghazi, Libya', ip: '10.0.0.42', active: '2 days ago', isCurrent: false },
        { id: 3, name: 'Samsung S21', type: 'mobile', location: 'Tunis, Tunisia', ip: '172.16.0.1', active: '1 week ago', isCurrent: false },
    ]);

    const handleRemove = (id: number) => {
        if (window.confirm("Are you sure you want to remove this device? It will be logged out.")) {
            setDevices(prev => prev.filter(d => d.id !== id));
            addNotification({ icon: 'info', title: 'Device Removed', message: 'Access revoked for device.' });
        }
    };

    return (
        <PageLayout title={t('device_management')} scrollable={false}>
            <div className="flex flex-col h-full bg-background-primary">
                <div className="flex-grow overflow-y-auto p-4 space-y-6">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">Active Devices ({devices.length})</h3>
                    </div>

                    {devices.map(device => (
                        <div key={device.id} className={`bg-background-secondary p-5 rounded-2xl border transition-all ${device.isCurrent ? `border-${primaryColor} shadow-[0_0_15px_rgba(0,0,0,0.1)]` : 'border-border-divider'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-full ${device.isCurrent ? `bg-${primaryColor}/10 text-${primaryColor}` : 'bg-background-tertiary text-text-secondary'}`}>
                                        {device.type === 'mobile' ? <Smartphone className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-text-primary text-base">{device.name}</p>
                                            {device.isCurrent && <span className={`bg-${primaryColor} text-background-primary text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider`}>Current</span>}
                                        </div>
                                        <p className="text-xs text-text-secondary mt-1 font-medium">{device.type === 'mobile' ? 'Mobile App' : 'Web Browser'}</p>
                                    </div>
                                </div>
                                {!device.isCurrent && (
                                    <button onClick={() => handleRemove(device.id)} className="p-2 text-text-secondary hover:text-error hover:bg-background-tertiary rounded-lg transition-colors">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 text-xs text-text-secondary bg-background-tertiary/30 p-4 rounded-xl border border-border-divider/30">
                                <div className="flex items-center gap-2">
                                    <Globe className="w-3.5 h-3.5 opacity-70" />
                                    <span className="truncate">{device.location}</span>
                                </div>
                                <div className="flex items-center gap-2 justify-end text-end">
                                    <span className="font-mono opacity-70">IP:</span>
                                    <span className="font-mono">{device.ip}</span>
                                </div>
                                <div className="flex items-center gap-2 col-span-2 pt-2 mt-1 border-t border-border-divider/20">
                                    <Clock className="w-3.5 h-3.5 opacity-70" />
                                    <span>Last active: <span className={`font-bold ${device.isCurrent ? 'text-success' : 'text-text-primary'}`}>{device.active}</span></span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 pb-8 bg-background-primary border-t border-border-divider/10 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
                    <button className="w-full py-4 rounded-xl border border-error text-error font-bold text-sm hover:bg-error/5 transition-colors flex items-center justify-center gap-2 active:scale-[0.98]">
                        <ShieldAlert className="w-5 h-5" />
                        Log Out All Other Devices
                    </button>
                </div>
            </div>
        </PageLayout>
    );
};

export default DeviceManagementScreen;
