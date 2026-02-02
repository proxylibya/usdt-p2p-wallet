
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { SettingsProvider } from './context/SettingsContext';
import { LiveDataProvider } from './context/LiveDataContext';
import { MarketProvider } from './context/MarketContext';
import { WalletProvider } from './context/WalletContext';
import { P2PProvider } from './context/P2PContext';
import { CallProvider } from './context/CallContext';
import { Web3Provider } from './context/Web3Context';
import { SiteConfigProvider } from './context/SiteConfigContext';
import { NetworkProvider } from './context/NetworkContext';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeSafeList } from './components/ThemeSafeList';
import { UserAppLayout } from './components/UserAppLayout';
import { UserPreferenceSync } from './components/UserPreferenceSync';
import { ToastContainer } from './components/ToastContainer';

// Helper to compose providers and avoid "Provider Hell" nesting
// This significantly reduces indentation and improves readability
const ComposeProviders: React.FC<{
    components: Array<React.ComponentType<{ children: React.ReactNode }>>;
    children: React.ReactNode;
}> = ({ components, children }) => {
    return (
        <>
            {components.reduceRight(
                (acc, Comp) => (
                    <Comp>{acc}</Comp>
                ),
                children
            )}
        </>
    );
};

const App: React.FC = () => {
    // Order matters: Logic providers inside UI/State providers
    const providers = [
        SiteConfigProvider, // Site configuration first
        NetworkProvider, // Network status early for feature gates
        ThemeProvider,
        LanguageProvider,
        AuthProvider,
        NotificationProvider,
        CurrencyProvider,
        SettingsProvider,
        MarketProvider,
        WalletProvider,
        P2PProvider,
        CallProvider,
        Web3Provider,
        LiveDataProvider, // LiveData aggregates others, so it comes last
    ];

    return (
        <ErrorBoundary>
            <ComposeProviders components={providers}>
                <UserPreferenceSync />
                <BrowserRouter>
                    <UserAppLayout />
                    <ToastContainer />
                </BrowserRouter>
                <ThemeSafeList />
            </ComposeProviders>
        </ErrorBoundary>
    );
};

export default App;
