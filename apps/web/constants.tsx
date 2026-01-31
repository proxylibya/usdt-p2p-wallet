
import { FAQItem, PaymentMethod, Wallet, AdminUser, KYCStatus } from './types';

// ============================================
// 📋 STATIC CONFIGURATION DATA
// ============================================

export const ALL_PAYMENT_METHODS: PaymentMethod[] = [
    // Libya (LY) - Authentic Payment Methods
    { key: 'sadad', label: 'Sadad (سداد)', scope: 'local', countryCode: 'LY' },
    { key: 'mobicash', label: 'MobiCash (موبي كاش)', scope: 'local', countryCode: 'LY' },
    { key: 'tadavul', label: 'Tadavul (تداول)', scope: 'local', countryCode: 'LY' },
    { key: 'aman_bank', label: 'Aman Bank (مصرف الأمان)', scope: 'local', countryCode: 'LY' },
    { key: 'wahda_bank', label: 'Wahda Bank (مصرف الوحدة)', scope: 'local', countryCode: 'LY' },
    { key: 'jumhouria_bank', label: 'Jumhouria Bank (مصرف الجمهورية)', scope: 'local', countryCode: 'LY' },
    { key: 'sahara_bank', label: 'Sahara Bank (مصرف الصحارى)', scope: 'local', countryCode: 'LY' },
    { key: 'nab_bank', label: 'North Africa Bank (شمال أفريقيا)', scope: 'local', countryCode: 'LY' },
    { key: 'ncn_bank', label: 'NCB (التجاري الوطني)', scope: 'local', countryCode: 'LY' },
    { key: 'commerce_dev_bank', label: 'Commerce & Development Bank', scope: 'local', countryCode: 'LY' },
    { key: 'yaqeen_bank', label: 'Yaqeen Bank (مصرف اليقين)', scope: 'local', countryCode: 'LY' },
    { key: 'andalus_bank', label: 'Andalus Bank (مصرف الأندلس)', scope: 'local', countryCode: 'LY' },
    { key: 'local_bank_transfer', label: 'Local Bank Transfer', scope: 'local', countryCode: 'LY' },
    { key: 'madar_pay', label: 'Al Madar Pay', scope: 'local', countryCode: 'LY' },
    { key: 'libyana_pay', label: 'Libyana Pay', scope: 'local', countryCode: 'LY' },
    
    // Saudi Arabia (SA)
    { key: 'stc_pay', label: 'STC Pay', scope: 'local', countryCode: 'SA' },
    { key: 'urpay', label: 'UrPay', scope: 'local', countryCode: 'SA' },
    { key: 'alrajhi_bank', label: 'Al Rajhi Bank', scope: 'local', countryCode: 'SA' },
    { key: 'saudi_national_bank', label: 'SNB (AlAhli)', scope: 'local', countryCode: 'SA' },
    { key: 'inma_bank', label: 'Alinma Bank', scope: 'local', countryCode: 'SA' },
    
    // Egypt (EG)
    { key: 'vodafone_cash', label: 'Vodafone Cash', scope: 'local', countryCode: 'EG' },
    { key: 'instapay', label: 'InstaPay', scope: 'local', countryCode: 'EG' },
    { key: 'cib_bank', label: 'CIB Bank', scope: 'local', countryCode: 'EG' },
    { key: 'bank_misr', label: 'Banque Misr', scope: 'local', countryCode: 'EG' },
    
    // Global
    { key: 'wise', label: 'Wise', scope: 'global' },
    { key: 'revolut', label: 'Revolut', scope: 'global' },
    { key: 'binance_pay', label: 'Binance Pay', scope: 'global' },
    { key: 'bank_transfer_intl', label: 'Bank Transfer (Intl)', scope: 'global' },
];


export const FAQ_DATA: FAQItem[] = [
  { id: 'faq1', question: 'What is a stablecoin?', answer: 'A stablecoin is a type of cryptocurrency whose value is pegged to another asset class, such as a fiat currency or gold, to maintain a stable price.' },
  { id: 'faq2', question: 'How do I deposit funds?', answer: 'Navigate to the Wallet screen, tap on "Deposit", select the asset and network, and then send funds to the provided QR code or address.' },
  { id: 'faq3', question: 'Are my funds secure?', answer: 'Yes, we employ industry-leading security measures including 2-Factor Authentication, encrypted storage, and regular security audits to protect your assets.' },
  { id: 'faq4', question: 'What are the fees for swapping?', answer: 'We charge a competitive flat fee of 0.05% for all cross-chain swaps. Network fees may also apply depending on blockchain congestion.' },
];

// ============================================
// 💰 WALLET DATA (Mock/Initial)
// ============================================

export const WALLETS: Wallet[] = [
    { id: 'wallet-usdt-1', name: 'Tether', symbol: 'USDT', network: 'TRC20', balance: 1250.50, lockedBalance: 0, usdValue: 1250.50, change24h: 0.01 },
    { id: 'wallet-usdc-1', name: 'USD Coin', symbol: 'USDC', network: 'ERC20', balance: 500.00, lockedBalance: 0, usdValue: 500.00, change24h: -0.02 },
    { id: 'wallet-busd-1', name: 'Binance USD', symbol: 'BUSD', network: 'BEP20', balance: 320.75, lockedBalance: 50, usdValue: 370.75, change24h: 0.00 },
    { id: 'wallet-dai-1', name: 'DAI', symbol: 'DAI', network: 'ERC20', balance: 150.00, lockedBalance: 0, usdValue: 150.00, change24h: 0.03 },
];

// ============================================
// 📬 MOCK DEPOSIT ADDRESSES
// ============================================

export const MOCK_ADDRESSES: Record<string, Record<string, string>> = {
    'USDT': {
        'TRC20': 'TN7hZmJYhxZ9eN8F8jvPqRcYgV1zKqzPHs',
        'ERC20': '0x742d35Cc6634C0532925a3b844Bc9e7595f8a2d1',
        'BEP20': '0x742d35Cc6634C0532925a3b844Bc9e7595f8a2d1',
        'SOL': '7EcDhSYGxXyscszYEp35KHN8sQJsJNwg1Y3nGGbLqPjL',
    },
    'USDC': {
        'ERC20': '0x8F2e3B3a4C5D6E7F8A9B0C1D2E3F4A5B6C7D8E9F',
        'BEP20': '0x8F2e3B3a4C5D6E7F8A9B0C1D2E3F4A5B6C7D8E9F',
        'SOL': '8GcDhTYHyXyscszZFq46LIN9tRKtKOxh2Z4oHHcMqQkM',
    },
    'BUSD': {
        'BEP20': '0xA1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0',
    },
    'DAI': {
        'ERC20': '0xC9D0E1F2A3B4C5D6E7F8A9B0A1B2C3D4E5F6A7B8',
    },
};

// ============================================
// 👥 ADMIN DATA (Mock)
// ============================================

export const ADMIN_USERS: AdminUser[] = [
    { id: 'admin-user-1', name: 'Ahmed Ali', phoneNumber: '+218912345678', avatarUrl: 'https://picsum.photos/seed/user1/40/40', status: 'Active', joinDate: '2024-01-15', lastLogin: '2 hours ago', totalVolume: 15420.50, kycStatus: KYCStatus.VERIFIED },
    { id: 'admin-user-2', name: 'Sara Mohamed', phoneNumber: '+218923456789', avatarUrl: 'https://picsum.photos/seed/user2/40/40', status: 'Active', joinDate: '2024-02-20', lastLogin: '1 day ago', totalVolume: 8750.00, kycStatus: KYCStatus.VERIFIED },
    { id: 'admin-user-3', name: 'Omar Hassan', phoneNumber: '+218934567890', avatarUrl: 'https://picsum.photos/seed/user3/40/40', status: 'Pending', joinDate: '2024-03-10', lastLogin: '3 days ago', totalVolume: 2100.25, kycStatus: KYCStatus.PENDING },
    { id: 'admin-user-4', name: 'Fatima Yousef', phoneNumber: '+218945678901', avatarUrl: 'https://picsum.photos/seed/user4/40/40', status: 'Banned', joinDate: '2024-01-05', lastLogin: '1 week ago', totalVolume: 450.00, kycStatus: KYCStatus.REJECTED },
];

export const ADMIN_TRANSACTIONS = [
    { id: 'tx-admin-1', user: 'Ahmed Ali', type: 'Deposit', amount: 500, status: 'Completed', date: '2024-03-15 14:30' },
    { id: 'tx-admin-2', user: 'Sara Mohamed', type: 'Withdraw', amount: 250, status: 'Pending', date: '2024-03-15 12:15' },
    { id: 'tx-admin-3', user: 'Omar Hassan', type: 'P2P Buy', amount: 1000, status: 'Completed', date: '2024-03-14 18:45' },
    { id: 'tx-admin-4', user: 'Fatima Yousef', type: 'Swap', amount: 150, status: 'Failed', date: '2024-03-14 10:20' },
    { id: 'tx-admin-5', user: 'Ahmed Ali', type: 'P2P Sell', amount: 800, status: 'In Progress', date: '2024-03-13 16:00' },
];

