import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Ban,
  CheckCircle,
  Wallet,
  ArrowLeftRight,
  AlertTriangle,
  Edit,
  Key,
  Clock,
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

interface UserDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  status: 'active' | 'suspended' | 'pending';
  kycStatus: 'verified' | 'pending' | 'rejected' | 'none';
  role: 'user' | 'merchant' | 'admin';
  createdAt: string;
  lastLogin: string;
  wallets: { symbol: string; balance: number; network: string }[];
  stats: {
    totalDeposits: number;
    totalWithdrawals: number;
    totalP2PTrades: number;
    completedTrades: number;
    disputesCount: number;
  };
  recentTransactions: {
    id: string;
    type: string;
    amount: number;
    asset: string;
    status: string;
    date: string;
  }[];
}

const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'wallets' | 'transactions' | 'security'>('overview');

  useEffect(() => {
    fetchUserDetail();
  }, [id]);

  const fetchUserDetail = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<UserDetail>(`/admin/users/${id}`);
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch {
      error('Load Failed', 'Failed to load user details');
      navigate('/users');
    }
    setIsLoading(false);
  };

  const handleSuspend = async () => {
    try {
      await apiClient.patch(`/admin/users/${id}/suspend`);
      success('User Suspended', 'User has been suspended');
      fetchUserDetail();
    } catch {
      error('Action Failed', 'Failed to suspend user');
    }
  };

  const handleActivate = async () => {
    try {
      await apiClient.patch(`/admin/users/${id}/activate`);
      success('User Activated', 'User has been activated');
      fetchUserDetail();
    } catch {
      error('Action Failed', 'Failed to activate user');
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-brand-yellow border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/users')} className="p-2 hover:bg-background-secondary rounded-lg">
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-text-primary">User Details</h1>
          <p className="text-text-secondary">ID: {user.id}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate(`/users/${id}/edit`)}
            className="btn-secondary flex items-center gap-2"
          >
            <Edit className="w-4 h-4" /> Edit
          </button>
          {user.status === 'active' ? (
            <button onClick={handleSuspend} className="btn-danger flex items-center gap-2">
              <Ban className="w-4 h-4" /> Suspend
            </button>
          ) : (
            <button onClick={handleActivate} className="btn-success flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Activate
            </button>
          )}
        </div>
      </div>

      {/* User Card */}
      <div className="bg-background-secondary p-6 rounded-xl border border-border-divider">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-20 h-20 rounded-full bg-brand-yellow/20 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-brand-yellow">{user.name.charAt(0)}</span>
            )}
          </div>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-text-secondary" />
              <div>
                <p className="text-sm text-text-secondary">Name</p>
                <p className="font-medium text-text-primary">{user.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-text-secondary" />
              <div>
                <p className="text-sm text-text-secondary">Email</p>
                <p className="font-medium text-text-primary">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-text-secondary" />
              <div>
                <p className="text-sm text-text-secondary">Phone</p>
                <p className="font-medium text-text-primary">{user.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-text-secondary" />
              <div>
                <p className="text-sm text-text-secondary">Role</p>
                <p className="font-medium text-text-primary capitalize">{user.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-text-secondary" />
              <div>
                <p className="text-sm text-text-secondary">Joined</p>
                <p className="font-medium text-text-primary">{user.createdAt}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-text-secondary" />
              <div>
                <p className="text-sm text-text-secondary">Last Login</p>
                <p className="font-medium text-text-primary">{user.lastLogin}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className={`badge ${user.status === 'active' ? 'badge-success' : 'badge-error'}`}>
              {user.status}
            </span>
            <span className={`badge ${user.kycStatus === 'verified' ? 'badge-success' : user.kycStatus === 'pending' ? 'badge-warning' : 'badge-error'}`}>
              KYC: {user.kycStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border-divider">
        {(['overview', 'wallets', 'transactions', 'security'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-brand-yellow border-b-2 border-brand-yellow'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-status-success/20 rounded-xl">
                <Wallet className="w-6 h-6 text-status-success" />
              </div>
              <div>
                <p className="text-text-secondary text-sm">Total Deposits</p>
                <p className="text-xl font-bold text-text-primary">${user.stats.totalDeposits.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-status-error/20 rounded-xl">
                <ArrowLeftRight className="w-6 h-6 text-status-error" />
              </div>
              <div>
                <p className="text-text-secondary text-sm">Total Withdrawals</p>
                <p className="text-xl font-bold text-text-primary">${user.stats.totalWithdrawals.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-yellow/20 rounded-xl">
                <CheckCircle className="w-6 h-6 text-brand-yellow" />
              </div>
              <div>
                <p className="text-text-secondary text-sm">P2P Trades</p>
                <p className="text-xl font-bold text-text-primary">{user.stats.completedTrades}/{user.stats.totalP2PTrades}</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-status-warning/20 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-status-warning" />
              </div>
              <div>
                <p className="text-text-secondary text-sm">Disputes</p>
                <p className="text-xl font-bold text-text-primary">{user.stats.disputesCount}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'wallets' && (
        <div className="bg-background-secondary rounded-xl border border-border-divider overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Network</th>
                <th>Balance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {user.wallets.map((wallet, idx) => (
                <tr key={idx}>
                  <td className="font-medium text-text-primary">{wallet.symbol}</td>
                  <td className="text-text-secondary">{wallet.network}</td>
                  <td className="font-medium text-text-primary">{wallet.balance.toLocaleString()}</td>
                  <td>
                    <button className="btn-secondary text-sm">View History</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-background-secondary rounded-xl border border-border-divider overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Asset</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {user.recentTransactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="text-text-primary">{tx.type}</td>
                  <td className="text-text-secondary">{tx.asset}</td>
                  <td className="font-medium text-text-primary">{tx.amount.toLocaleString()}</td>
                  <td>
                    <span className={`badge ${tx.status === 'Completed' ? 'badge-success' : 'badge-warning'}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="text-text-secondary">{tx.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="bg-background-secondary p-6 rounded-xl border border-border-divider space-y-4">
          <div className="flex items-center justify-between p-4 bg-background-tertiary rounded-lg">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-text-secondary" />
              <div>
                <p className="font-medium text-text-primary">Reset Password</p>
                <p className="text-sm text-text-secondary">Send password reset email to user</p>
              </div>
            </div>
            <button className="btn-secondary">Send Reset</button>
          </div>
          <div className="flex items-center justify-between p-4 bg-background-tertiary rounded-lg">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-text-secondary" />
              <div>
                <p className="font-medium text-text-primary">Two-Factor Authentication</p>
                <p className="text-sm text-text-secondary">User has 2FA enabled</p>
              </div>
            </div>
            <span className="badge badge-success">Enabled</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetailPage;
