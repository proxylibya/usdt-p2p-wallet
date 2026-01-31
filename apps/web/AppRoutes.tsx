
import React, { lazy } from 'react';
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AnimatedPage from './components/AnimatedPage';
import AdminLayout from './pages/admin/AdminLayout';
import { FullScreenLoader } from './components/FullScreenLoader';

// Lazy load User pages
const HomeScreen = lazy(() => import('./pages/HomeScreen'));
const WalletScreen = lazy(() => import('./pages/WalletScreen'));
const P2PScreen = lazy(() => import('./pages/P2PScreen'));
const SwapScreen = lazy(() => import('./pages/swap/SwapScreen'));
const SettingsScreen = lazy(() => import('./pages/SettingsScreen'));
const LoginScreen = lazy(() => import('./pages/auth/LoginScreen'));
const RegisterScreen = lazy(() => import('./pages/auth/RegisterScreen'));
const ForgotPasswordScreen = lazy(() => import('./pages/auth/ForgotPasswordScreen'));
const NotificationsScreen = lazy(() => import('./pages/NotificationsScreen'));
const ProfileScreen = lazy(() => import('./pages/ProfileScreen'));
const EditProfileScreen = lazy(() => import('./pages/EditProfileScreen'));
const SecurityScreen = lazy(() => import('./pages/SecurityScreen'));
const DepositScreen = lazy(() => import('./pages/wallet/DepositScreen'));
const WithdrawScreen = lazy(() => import('./pages/wallet/WithdrawScreen'));
const SendScreen = lazy(() => import('./pages/wallet/SendScreen'));
const ReceiveScreen = lazy(() => import('./pages/wallet/ReceiveScreen'));
const TransferScreen = lazy(() => import('./pages/wallet/TransferScreen'));
const TransactionDetailsScreen = lazy(() => import('./pages/wallet/TransactionDetailsScreen'));
const HistoryScreen = lazy(() => import('./pages/wallet/HistoryScreen'));
const FAQScreen = lazy(() => import('./pages/static/FAQScreen'));
const SupportScreen = lazy(() => import('./pages/static/SupportScreen'));
const AboutScreen = lazy(() => import('./pages/static/AboutScreen'));
const PrivacyScreen = lazy(() => import('./pages/static/PrivacyScreen'));
const NotFoundScreen = lazy(() => import('./pages/static/NotFoundScreen'));
const CreateOfferScreen = lazy(() => import('./pages/p2p/CreateOfferScreen'));
const TradeRoomScreen = lazy(() => import('./pages/p2p/TradeRoomScreen'));
const KYCScreen = lazy(() => import('./pages/profile/KYCScreen'));
const AddressBookScreen = lazy(() => import('./pages/profile/AddressBookScreen'));
const PaymentMethodsScreen = lazy(() => import('./pages/profile/PaymentMethodsScreen'));
const MarketsScreen = lazy(() => import('./pages/MarketsScreen'));
const CoinDetailScreen = lazy(() => import('./pages/CoinDetailScreen'));
const TradesScreen = lazy(() => import('./pages/TradesScreen'));
const ReferralScreen = lazy(() => import('./pages/profile/ReferralScreen'));
const TaskCenterScreen = lazy(() => import('./pages/profile/TaskCenterScreen'));
const RewardsScreen = lazy(() => import('./pages/profile/RewardsScreen'));
const EidyaScreen = lazy(() => import('./pages/EidyaScreen'));
const StakingScreen = lazy(() => import('./pages/earn/StakingScreen'));
const DAppBrowserScreen = lazy(() => import('./pages/web3/DAppBrowserScreen'));

// Security Subpages
const ChangePasswordScreen = lazy(() => import('./pages/security/ChangePasswordScreen'));
const TwoFactorScreen = lazy(() => import('./pages/security/TwoFactorScreen'));
const DeviceManagementScreen = lazy(() => import('./pages/security/DeviceManagementScreen'));
const PasscodeScreen = lazy(() => import('./pages/security/PasscodeScreen'));
const SecurityQuestionsScreen = lazy(() => import('./pages/security/SecurityQuestionsScreen'));
const AccountActivityScreen = lazy(() => import('./pages/security/AccountActivityScreen'));

// Lazy load Admin pages
const AdminLoginScreen = lazy(() => import('./pages/admin/AdminLoginScreen'));
const DashboardScreen = lazy(() => import('./pages/admin/DashboardScreen'));
const UsersScreen = lazy(() => import('./pages/admin/UsersScreen'));
const TransactionsScreen = lazy(() => import('./pages/admin/TransactionsScreen'));
const ReportsScreen = lazy(() => import('./pages/admin/ReportsScreen'));
const AdminSettingsScreen = lazy(() => import('./pages/admin/AdminSettingsScreen'));
const DisputesScreen = lazy(() => import('./pages/admin/DisputesScreen'));

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const isAdmin = localStorage.getItem('usdt_wallet_admin_token');
    
    if (!isAdmin) {
        return <Navigate to="/admin/login" replace />;
    }

    return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
    return (
        <Routes>
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AnimatedPage><AdminLoginScreen /></AnimatedPage>} />
            <Route path="/admin" element={<ProtectedAdminRoute><AdminLayout /></ProtectedAdminRoute>}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<DashboardScreen />} />
                <Route path="users" element={<UsersScreen />} />
                <Route path="transactions" element={<TransactionsScreen />} />
                <Route path="disputes" element={<DisputesScreen />} />
                <Route path="reports" element={<ReportsScreen />} />
                <Route path="settings" element={<AdminSettingsScreen />} />
            </Route>

            {/* User App Routes */}
            {/* Public Routes */}
            <Route path="/" element={<AnimatedPage><HomeScreen /></AnimatedPage>} />
            <Route path="/markets" element={<AnimatedPage><MarketsScreen /></AnimatedPage>} />
            <Route path="/markets/:coinId" element={<AnimatedPage><CoinDetailScreen /></AnimatedPage>} />
            <Route path="/p2p" element={<AnimatedPage><P2PScreen /></AnimatedPage>} />
            <Route path="/swap" element={<AnimatedPage><SwapScreen /></AnimatedPage>} />
            <Route path="/login" element={<AnimatedPage><LoginScreen /></AnimatedPage>} />
            <Route path="/register" element={<AnimatedPage><RegisterScreen /></AnimatedPage>} />
            <Route path="/forgot-password" element={<AnimatedPage><ForgotPasswordScreen /></AnimatedPage>} />
            <Route path="/faq" element={<AnimatedPage><FAQScreen /></AnimatedPage>} />
            <Route path="/support" element={<AnimatedPage><SupportScreen /></AnimatedPage>} />
            <Route path="/about" element={<AnimatedPage><AboutScreen /></AnimatedPage>} />
            <Route path="/privacy" element={<AnimatedPage><PrivacyScreen /></AnimatedPage>} />
            <Route path="/trades" element={<AnimatedPage><TradesScreen /></AnimatedPage>} />

            {/* Protected Routes */}
            <Route path="/wallet" element={<ProtectedRoute><AnimatedPage><WalletScreen /></AnimatedPage></ProtectedRoute>} />
            <Route path="/wallet/history" element={<ProtectedRoute><AnimatedPage><HistoryScreen /></AnimatedPage></ProtectedRoute>} />
            <Route path="/wallet/transaction/:id" element={<ProtectedRoute><AnimatedPage><TransactionDetailsScreen /></AnimatedPage></ProtectedRoute>} />
            <Route path="/deposit" element={<ProtectedRoute><AnimatedPage><DepositScreen /></AnimatedPage></ProtectedRoute>} />
            <Route path="/withdraw" element={<ProtectedRoute><AnimatedPage><WithdrawScreen /></AnimatedPage></ProtectedRoute>} />
            <Route path="/send" element={<ProtectedRoute><AnimatedPage><SendScreen /></AnimatedPage></ProtectedRoute>} />
            <Route path="/receive" element={<ProtectedRoute><AnimatedPage><ReceiveScreen /></AnimatedPage></ProtectedRoute>} />
            <Route path="/transfer" element={<ProtectedRoute><AnimatedPage><TransferScreen /></AnimatedPage></ProtectedRoute>} />
            <Route path="/earn" element={<ProtectedRoute><AnimatedPage><StakingScreen /></AnimatedPage></ProtectedRoute>} />
            <Route path="/web3/browser" element={<ProtectedRoute><AnimatedPage><DAppBrowserScreen /></AnimatedPage></ProtectedRoute>} />
            
            <Route path="/p2p/create" element={<ProtectedRoute><AnimatedPage><CreateOfferScreen /></AnimatedPage></ProtectedRoute>} />
            <Route path="/p2p/trade/:id" element={<ProtectedRoute><AnimatedPage><TradeRoomScreen /></AnimatedPage></ProtectedRoute>} />
            
            <Route path="/settings" element={<ProtectedRoute><AnimatedPage><SettingsScreen /></AnimatedPage></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><AnimatedPage><NotificationsScreen /></AnimatedPage></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><AnimatedPage><ProfileScreen /></AnimatedPage></ProtectedRoute>} />
            <Route path="/profile/edit" element={<ProtectedRoute><AnimatedPage><EditProfileScreen /></AnimatedPage></ProtectedRoute>} />
            <Route path="/profile/kyc" element={<ProtectedRoute><AnimatedPage><KYCScreen /></AnimatedPage></ProtectedRoute>} />
            <Route path="/profile/payment-methods" element={<ProtectedRoute><AnimatedPage><PaymentMethodsScreen /></AnimatedPage></ProtectedRoute>} />
            <Route path="/referral" element={<ProtectedRoute><AnimatedPage><ReferralScreen /></AnimatedPage></ProtectedRoute>} />
            <Route path="/tasks" element={<ProtectedRoute><AnimatedPage><TaskCenterScreen /></AnimatedPage></ProtectedRoute>} />
            <Route path="/rewards" element={<ProtectedRoute><AnimatedPage><RewardsScreen /></AnimatedPage></ProtectedRoute>} />
            <Route path="/eidya" element={<ProtectedRoute><AnimatedPage><EidyaScreen /></AnimatedPage></ProtectedRoute>} />
            
            <Route path="/security" element={<ProtectedRoute><AnimatedPage><SecurityScreen /></AnimatedPage></ProtectedRoute>} />
            <Route path="/security/address-book" element={<ProtectedRoute><AnimatedPage><AddressBookScreen /></AnimatedPage></ProtectedRoute>} />
            <Route path="/security/password" element={<ProtectedRoute><AnimatedPage><ChangePasswordScreen /></AnimatedPage></ProtectedRoute>} />
            <Route path="/security/2fa" element={<ProtectedRoute><AnimatedPage><TwoFactorScreen /></AnimatedPage></ProtectedRoute>} />
            <Route path="/security/devices" element={<ProtectedRoute><AnimatedPage><DeviceManagementScreen /></AnimatedPage></ProtectedRoute>} />
            <Route path="/security/passcode" element={<ProtectedRoute><AnimatedPage><PasscodeScreen /></AnimatedPage></ProtectedRoute>} />
            <Route path="/security/questions" element={<ProtectedRoute><AnimatedPage><SecurityQuestionsScreen /></AnimatedPage></ProtectedRoute>} />
            <Route path="/security/activity" element={<ProtectedRoute><AnimatedPage><AccountActivityScreen /></AnimatedPage></ProtectedRoute>} />

            {/* Catch All - 404 */}
            <Route path="*" element={<AnimatedPage><NotFoundScreen /></AnimatedPage>} />
        </Routes>
    );
};
