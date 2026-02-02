import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  Wallet,
  Store,
  AlertTriangle,
  UserCheck,
  BarChart3,
  Settings,
  ScrollText,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Shield,
  TrendingUp,
  Activity,
  Headphones,
  Megaphone,
  UserCog,
  DollarSign,
  ShieldCheck,
  Sliders,
  Key,
  Palette,
  Globe,
} from 'lucide-react';
import { RealtimeIndicator, LiveNotificationCenter, LiveStatsBar } from '../components/RealtimeDashboard';
import { NetworkStatusBadge, NetworkBanner } from '../components/NetworkStatusBadge';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  children?: { label: string; path: string }[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Users', path: '/users', icon: <Users className="w-5 h-5" /> },
  { label: 'Admin Users', path: '/admins', icon: <UserCog className="w-5 h-5" /> },
  { label: 'Transactions', path: '/transactions', icon: <ArrowLeftRight className="w-5 h-5" /> },
  { label: 'Wallets', path: '/wallets', icon: <Wallet className="w-5 h-5" /> },
  {
    label: 'P2P Trading',
    path: '/p2p',
    icon: <Store className="w-5 h-5" />,
    children: [
      { label: 'Offers', path: '/p2p/offers' },
      { label: 'Trades', path: '/p2p/trades' },
      { label: 'Payment Methods', path: '/p2p/payment-methods' },
    ],
  },
  { label: 'Earn Products', path: '/earn/products', icon: <TrendingUp className="w-5 h-5" /> },
  { label: 'Fees & Revenue', path: '/fees', icon: <DollarSign className="w-5 h-5" /> },
  { label: 'Limits & Rules', path: '/limits', icon: <Sliders className="w-5 h-5" /> },
  { label: 'API Keys', path: '/api-keys', icon: <Key className="w-5 h-5" /> },
  { label: 'Disputes', path: '/disputes', icon: <AlertTriangle className="w-5 h-5" /> },
  { label: 'KYC Verification', path: '/kyc', icon: <UserCheck className="w-5 h-5" /> },
  { label: 'Support Tickets', path: '/support', icon: <Headphones className="w-5 h-5" /> },
  { label: 'Announcements', path: '/announcements', icon: <Megaphone className="w-5 h-5" /> },
  { label: 'Security Center', path: '/security', icon: <ShieldCheck className="w-5 h-5" /> },
  { 
    label: '🌐 Network Mode', 
    path: '/network', 
    icon: <Globe className="w-5 h-5" />,
    children: [
      { label: 'Network Settings', path: '/network-config' },
      { label: 'Blockchain Config', path: '/network-config?tab=blockchain' },
      { label: 'Mode History', path: '/network-config?tab=history' },
    ]
  },
  { label: 'System Monitor', path: '/monitoring', icon: <Activity className="w-5 h-5" /> },
  { label: 'Reports', path: '/reports', icon: <BarChart3 className="w-5 h-5" /> },
  { 
    label: 'SMS System', 
    path: '/sms', 
    icon: <Megaphone className="w-5 h-5" />,
    children: [
      { label: 'Providers', path: '/sms/providers' },
      { label: 'Logs', path: '/sms/logs' },
    ]
  },
  { label: 'System Logs', path: '/logs', icon: <ScrollText className="w-5 h-5" /> },
  { label: 'Site Config', path: '/site-config', icon: <Palette className="w-5 h-5" /> },
  { label: 'Settings', path: '/settings', icon: <Settings className="w-5 h-5" /> },
];

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [pageKey, setPageKey] = useState(0);
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Trigger page transition animation on route change
  useEffect(() => {
    setPageKey(prev => prev + 1);
  }, [location.pathname]);

  const toggleExpand = (path: string) => {
    setExpandedItems(prev =>
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background-primary flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-background-secondary border-r border-border-divider transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-0 lg:w-20'
        } overflow-hidden`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-border-divider">
            {sidebarOpen && (
              <div className="flex items-center gap-2">
                <Shield className="w-8 h-8 text-brand-yellow" />
                <span className="font-bold text-lg text-text-primary">Admin Panel</span>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-background-tertiary lg:hidden"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>

          {/* Navigation with stagger animations */}
          <nav className="flex-1 overflow-y-auto py-4 px-2">
            {navItems.map((item, index) => (
              <div key={item.path} className="animate-fade-in-left" style={{ animationDelay: `${index * 30}ms` }}>
                {item.children ? (
                  <>
                    <button
                      onClick={() => toggleExpand(item.path)}
                      className="w-full sidebar-link justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        {sidebarOpen && <span>{item.label}</span>}
                      </div>
                      {sidebarOpen && (
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            expandedItems.includes(item.path) ? 'rotate-180' : ''
                          }`}
                        />
                      )}
                    </button>
                    {expandedItems.includes(item.path) && sidebarOpen && (
                      <div className="ml-8 mt-1 space-y-1">
                        {item.children.map(child => (
                          <NavLink
                            key={child.path}
                            to={child.path}
                            className={({ isActive }) =>
                              `block px-4 py-2 rounded-lg text-sm ${
                                isActive
                                  ? 'text-brand-yellow bg-brand-yellow/10'
                                  : 'text-text-secondary hover:text-text-primary hover:bg-background-tertiary'
                              }`
                            }
                          >
                            {child.label}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `sidebar-link ${isActive ? 'active' : ''}`
                    }
                  >
                    {item.icon}
                    {sidebarOpen && <span>{item.label}</span>}
                  </NavLink>
                )}
              </div>
            ))}
          </nav>

          {/* User Info */}
          {sidebarOpen && admin && (
            <div className="p-4 border-t border-border-divider">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-brand-yellow/20 flex items-center justify-center">
                  <span className="text-brand-yellow font-bold">
                    {admin.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-text-primary text-sm">{admin.name}</p>
                  <p className="text-xs text-text-secondary capitalize">{admin.role.replace('_', ' ')}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-status-error hover:bg-status-error/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Network Banner */}
        <NetworkBanner />
        
        {/* Header */}
        <header className="h-16 bg-background-secondary border-b border-border-divider flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-background-tertiary"
            >
              <Menu className="w-5 h-5 text-text-secondary" />
            </button>
            <div className="hidden lg:block">
              <LiveStatsBar />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NetworkStatusBadge />
            <RealtimeIndicator />
            <LiveNotificationCenter />
          </div>
        </header>

        {/* Page Content with Animation */}
        <main className="flex-1 p-6 overflow-auto">
          <div key={pageKey} className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;
