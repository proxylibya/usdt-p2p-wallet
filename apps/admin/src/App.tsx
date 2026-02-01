import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import UsersPage from './pages/users/UsersPage';
import UserDetailPage from './pages/users/UserDetailPage';
import CreateUserPage from './pages/users/CreateUserPage';
import EditUserPage from './pages/users/EditUserPage';
import TransactionsPage from './pages/transactions/TransactionsPage';
import TransactionDetailPage from './pages/transactions/TransactionDetailPage';
import WalletsPage from './pages/wallets/WalletsPage';
import P2POffersPage from './pages/p2p/OffersPage';
import OfferDetailPage from './pages/p2p/OfferDetailPage';
import P2PTradesPage from './pages/p2p/TradesPage';
import TradeDetailPage from './pages/p2p/TradeDetailPage';
import DisputesPage from './pages/disputes/DisputesPage';
import DisputeDetailPage from './pages/disputes/DisputeDetailPage';
import KYCPage from './pages/kyc/KYCPage';
import ReportsPage from './pages/reports/ReportsPage';
import SettingsPage from './pages/settings/SettingsPage';
import LogsPage from './pages/logs/LogsPage';
import StakingPage from './pages/earn/StakingPage';
import CreateStakingProductPage from './pages/earn/CreateStakingProductPage';
import AdminUsersPage from './pages/admins/AdminUsersPage';
import CreateAdminPage from './pages/admins/CreateAdminPage';
import SystemMonitoringPage from './pages/monitoring/SystemMonitoringPage';
import SupportTicketsPage from './pages/support/SupportTicketsPage';
import PaymentMethodsPage from './pages/payments/PaymentMethodsPage';
import PaymentMethodFormPage from './pages/payments/PaymentMethodFormPage';
import AnnouncementsPage from './pages/announcements/AnnouncementsPage';
import AnnouncementFormPage from './pages/announcements/CreateAnnouncementPage';
import AdvancedDashboardPage from './pages/dashboard/AdvancedDashboardPage';
import FeesManagementPage from './pages/fees/FeesManagementPage';
import FeeRuleFormPage from './pages/fees/FeeRuleFormPage';
import SecurityCenterPage from './pages/security/SecurityCenterPage';
import BlockEntityPage from './pages/security/BlockEntityPage';
import LimitsPage from './pages/limits/LimitsPage';
import LimitRuleFormPage from './pages/limits/LimitRuleFormPage';
import RestrictionFormPage from './pages/limits/RestrictionFormPage';
import ApiKeysPage from './pages/api-keys/ApiKeysPage';
import CreateApiKeyPage from './pages/api-keys/CreateApiKeyPage';

import SmsProvidersPage from './pages/sms/SmsProvidersPage';
import SmsProviderFormPage from './pages/sms/SmsProviderFormPage';
import SmsLogsPage from './pages/sms/SmsLogsPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<AdvancedDashboardPage />} />
              <Route path="dashboard/simple" element={<DashboardPage />} />
              
              {/* Users Management */}
              <Route path="users" element={<UsersPage />} />
              <Route path="users/create" element={<CreateUserPage />} />
              <Route path="users/:id" element={<UserDetailPage />} />
              <Route path="users/:id/edit" element={<EditUserPage />} />
              
              {/* Admin Users */}
              <Route path="admins" element={<AdminUsersPage />} />
              <Route path="admins/create" element={<CreateAdminPage />} />
              
              {/* Financial */}
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="transactions/:id" element={<TransactionDetailPage />} />
              <Route path="wallets" element={<WalletsPage />} />
              
              {/* P2P */}
              <Route path="p2p/offers" element={<P2POffersPage />} />
              <Route path="p2p/offers/:id" element={<OfferDetailPage />} />
              <Route path="p2p/trades" element={<P2PTradesPage />} />
              <Route path="p2p/trades/:id" element={<TradeDetailPage />} />
              <Route path="p2p/payment-methods" element={<PaymentMethodsPage />} />
              <Route path="p2p/payment-methods/create" element={<PaymentMethodFormPage />} />
              <Route path="p2p/payment-methods/:id/edit" element={<PaymentMethodFormPage />} />
              
              {/* Earn */}
              <Route path="earn/products" element={<StakingPage />} />
              <Route path="earn/products/create" element={<CreateStakingProductPage />} />
              
              {/* Fees & Revenue */}
              <Route path="fees" element={<FeesManagementPage />} />
              <Route path="fees/create" element={<FeeRuleFormPage />} />
              <Route path="fees/:id/edit" element={<FeeRuleFormPage />} />
              <Route path="limits" element={<LimitsPage />} />
              <Route path="limits/create" element={<LimitRuleFormPage />} />
              <Route path="limits/:id/edit" element={<LimitRuleFormPage />} />
              <Route path="limits/restrictions/create" element={<RestrictionFormPage />} />
              <Route path="api-keys" element={<ApiKeysPage />} />
              <Route path="api-keys/create" element={<CreateApiKeyPage />} />

              {/* Disputes */}
              <Route path="disputes" element={<DisputesPage />} />
              <Route path="disputes/:id" element={<DisputeDetailPage />} />
              
              {/* KYC */}
              <Route path="kyc" element={<KYCPage />} />
              
              {/* Support & Communication */}
              <Route path="support" element={<SupportTicketsPage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
              <Route path="announcements/create" element={<AnnouncementFormPage />} />
              <Route path="announcements/:id/edit" element={<AnnouncementFormPage />} />
              
              {/* Security */}
              <Route path="security" element={<SecurityCenterPage />} />
              <Route path="security/block" element={<BlockEntityPage />} />
              
              {/* System */}
              <Route path="monitoring" element={<SystemMonitoringPage />} />
              <Route path="reports" element={<ReportsPage />} />
              
              {/* SMS System */}
              <Route path="sms/providers" element={<SmsProvidersPage />} />
              <Route path="sms/providers/create" element={<SmsProviderFormPage />} />
              <Route path="sms/providers/:id/edit" element={<SmsProviderFormPage />} />
              <Route path="sms/logs" element={<SmsLogsPage />} />

              <Route path="settings" element={<SettingsPage />} />
              <Route path="logs" element={<LogsPage />} />
            </Route>
            
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
