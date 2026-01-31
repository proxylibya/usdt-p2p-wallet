import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Bell, X, ArrowUp, ArrowDown, Users, ArrowLeftRight, AlertTriangle, CheckCircle } from 'lucide-react';
import { realtimeService, useRealtimeConnection } from '../services/realtimeService';

interface LiveNotification {
  id: string;
  type: 'user' | 'transaction' | 'trade' | 'alert' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  severity?: 'info' | 'warning' | 'error' | 'success';
}

interface LiveStats {
  onlineUsers: number;
  onlineChange: number;
  activeTrades: number;
  tradesChange: number;
  pendingTx: number;
  txChange: number;
}

const RealtimeIndicator: React.FC = () => {
  const isConnected = useRealtimeConnection();

  useEffect(() => {
    realtimeService.connect();
    return () => {
      // Don't disconnect on unmount to keep connection alive
    };
  }, []);

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
      isConnected 
        ? 'bg-status-success/20 text-status-success' 
        : 'bg-status-error/20 text-status-error'
    }`}>
      {isConnected ? (
        <>
          <Wifi className="w-3.5 h-3.5" />
          <span>Live</span>
          <span className="w-2 h-2 bg-status-success rounded-full animate-pulse" />
        </>
      ) : (
        <>
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline</span>
        </>
      )}
    </div>
  );
};

const LiveNotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Subscribe to all relevant events
    const unsubscribers = [
      realtimeService.subscribe('user:new', (data: any) => {
        addNotification({
          type: 'user',
          title: 'New User',
          message: `${data.name} just registered`,
          severity: 'info',
        });
      }),
      realtimeService.subscribe('transaction:new', (data: any) => {
        addNotification({
          type: 'transaction',
          title: 'New Transaction',
          message: `${data.type}: $${data.amount}`,
          severity: 'info',
        });
      }),
      realtimeService.subscribe('trade:disputed', (data: any) => {
        addNotification({
          type: 'trade',
          title: 'Trade Disputed',
          message: `Trade #${data.id} has been disputed`,
          severity: 'warning',
        });
      }),
      realtimeService.subscribe('alert:security', (data: any) => {
        addNotification({
          type: 'alert',
          title: 'Security Alert',
          message: data.message,
          severity: 'error',
        });
      }),
    ];

    // Simulate some notifications for demo
    const demoInterval = setInterval(() => {
      const demoNotifications: Partial<LiveNotification>[] = [
        { type: 'user', title: 'New User', message: 'Ahmed joined the platform', severity: 'info' },
        { type: 'transaction', title: 'Withdrawal', message: '$500 withdrawal processed', severity: 'success' },
        { type: 'trade', title: 'Trade Completed', message: 'P2P trade #4521 completed', severity: 'success' },
      ];
      const random = demoNotifications[Math.floor(Math.random() * demoNotifications.length)];
      addNotification(random as Omit<LiveNotification, 'id' | 'timestamp'>);
    }, 45000);

    return () => {
      unsubscribers.forEach(unsub => unsub());
      clearInterval(demoInterval);
    };
  }, []);

  const addNotification = (notification: Omit<LiveNotification, 'id' | 'timestamp'>) => {
    const newNotification: LiveNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 50));
    setUnreadCount(prev => prev + 1);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'user': return <Users className="w-4 h-4" />;
      case 'transaction': return <ArrowLeftRight className="w-4 h-4" />;
      case 'trade': return <CheckCircle className="w-4 h-4" />;
      case 'alert': return <AlertTriangle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'error': return 'bg-status-error/20 text-status-error';
      case 'warning': return 'bg-status-warning/20 text-status-warning';
      case 'success': return 'bg-status-success/20 text-status-success';
      default: return 'bg-status-info/20 text-status-info';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => { setIsOpen(!isOpen); setUnreadCount(0); }}
        className="relative p-2 rounded-lg hover:bg-background-tertiary transition-colors"
      >
        <Bell className="w-5 h-5 text-text-secondary" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-status-error rounded-full text-xs text-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-12 w-80 bg-background-secondary border border-border-divider rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border-divider">
              <h3 className="font-semibold text-text-primary">Live Notifications</h3>
              <div className="flex items-center gap-2">
                <button onClick={clearNotifications} className="text-xs text-text-secondary hover:text-text-primary">
                  Clear All
                </button>
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-background-tertiary rounded">
                  <X className="w-4 h-4 text-text-secondary" />
                </button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-text-secondary">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div key={notif.id} className="p-3 border-b border-border-divider hover:bg-background-tertiary transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getSeverityColor(notif.severity)}`}>
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text-primary text-sm">{notif.title}</p>
                        <p className="text-xs text-text-secondary truncate">{notif.message}</p>
                        <p className="text-xs text-text-secondary mt-1">
                          {notif.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const LiveStatsBar: React.FC = () => {
  const [stats, setStats] = useState<LiveStats>({
    onlineUsers: 342,
    onlineChange: 5,
    activeTrades: 78,
    tradesChange: 2,
    pendingTx: 23,
    txChange: -3,
  });

  useEffect(() => {
    // Subscribe to stats updates
    const unsubscribe = realtimeService.subscribe('stats:updated', (data: any) => {
      setStats(prev => ({ ...prev, ...data }));
    });

    // Simulate live updates
    const interval = setInterval(() => {
      setStats(prev => ({
        onlineUsers: prev.onlineUsers + Math.floor(Math.random() * 10) - 5,
        onlineChange: Math.floor(Math.random() * 10) - 5,
        activeTrades: Math.max(0, prev.activeTrades + Math.floor(Math.random() * 4) - 2),
        tradesChange: Math.floor(Math.random() * 6) - 3,
        pendingTx: Math.max(0, prev.pendingTx + Math.floor(Math.random() * 4) - 2),
        txChange: Math.floor(Math.random() * 6) - 3,
      }));
    }, 10000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const StatItem: React.FC<{ label: string; value: number; change: number; icon: React.ReactNode }> = 
    ({ label, value, change, icon }) => (
      <div className="flex items-center gap-3 px-4 py-2">
        <div className="text-text-secondary">{icon}</div>
        <div>
          <p className="text-xs text-text-secondary">{label}</p>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text-primary">{value}</span>
            <span className={`flex items-center text-xs ${change >= 0 ? 'text-status-success' : 'text-status-error'}`}>
              {change >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {Math.abs(change)}
            </span>
          </div>
        </div>
      </div>
    );

  return (
    <div className="flex items-center divide-x divide-border-divider bg-background-secondary rounded-lg border border-border-divider">
      <StatItem label="Online Users" value={stats.onlineUsers} change={stats.onlineChange} icon={<Users className="w-4 h-4" />} />
      <StatItem label="Active Trades" value={stats.activeTrades} change={stats.tradesChange} icon={<ArrowLeftRight className="w-4 h-4" />} />
      <StatItem label="Pending Tx" value={stats.pendingTx} change={stats.txChange} icon={<AlertTriangle className="w-4 h-4" />} />
    </div>
  );
};

export { RealtimeIndicator, LiveNotificationCenter, LiveStatsBar };
export default RealtimeIndicator;
