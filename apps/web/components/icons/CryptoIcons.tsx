
import React from 'react';

export const UsdtIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="12" fill="#26A17B"/>
        <path fill="#ffffff" d="M13 8.5V6H17V4H7V6H11V8.5C8 8.7 6 9.5 6 10.5C6 11.5 8 12.3 11 12.5V19H13V12.5C16 12.3 18 11.5 18 10.5C18 9.5 16 8.7 13 8.5ZM12 11.5C9.8 11.5 8 11.1 8 10.5C8 9.9 9.8 9.5 12 9.5C14.2 9.5 16 9.9 16 10.5C16 11.1 14.2 11.5 12 11.5Z" />
    </svg>
);

export const UsdcIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="16" fill="#2775CA"/>
        <path d="M16 6.18c-5.42 0-9.82 4.4-9.82 9.82s4.4 9.82 9.82 9.82 9.82-4.4 9.82-9.82-4.4-9.82-9.82-9.82zm0 17.5c-4.24 0-7.68-3.44-7.68-7.68s3.44-7.68 7.68-7.68 7.68 3.44 7.68 7.68-3.44 7.68-7.68 7.68z" fill="#FFF"/>
        <path d="M17.47 19.34h-2.94v-1.78c-1.28-.4-2.22-1.57-2.22-2.95 0-1.72 1.39-3.12 3.12-3.12 1.39 0 2.58.91 2.96 2.16l-1.8.62c-.18-.54-.69-.92-1.26-.92-.7 0-1.27.57-1.27 1.27s.57 1.27 1.27 1.27v1.78h.8v1.78h.93v1.78h1.18v-1.78z" fill="#FFF"/>
    </svg>
);

export const BusdIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="16" fill="#F0B90B"/>
        <path d="m14.1 11.6-2.58 2.59 2.58 2.58-1.42 1.41-4-4-1.19-1.18 1.18-1.18 4-4 1.42 1.41zm3.8 0 2.58 2.59-2.58 2.58 1.42 1.41 4-4 1.18-1.18-1.18-1.18-4-4-1.42 1.41zm-1.9 4.31-1.41-1.42-2.59 2.58 2.59 2.59 1.41-1.42-1.18-1.18 1.18-1.18zm4.31-1.42-1.41 1.42 1.18 1.18-1.18 1.18 1.41 1.42 2.59-2.59-2.59-2.59zm-2.23 4.29-2.58-2.58-1.42 1.41 4 4 1.18 1.18 1.18-1.18 4-4-1.42-1.41-2.58 2.58-1.18 1.18-1.18-1.18z" fill="#fff"/>
    </svg>
);

export const DaiIcon: React.FC<{ className?: string }> = ({ className }) => (
     <svg className={className} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="16" fill="#F4B731"/>
        <path d="M16 6.18c-5.42 0-9.82 4.4-9.82 9.82s4.4 9.82 9.82 9.82 9.82-4.4 9.82-9.82S15.99 6.18 16 6.18zm0 17.5c-4.24 0-7.68-3.44-7.68-7.68s3.44-7.68 7.68-7.68 7.68 3.44 7.68 7.68-3.44 7.68-7.68 7.68z" fill="#FFF"/>
        <path d="M16.03 10.02H9.85v11.96h6.18c3.3 0 5.98-2.68 5.98-5.98s-2.68-5.98-5.98-5.98zm0 9.82H12v-7.68h4.03c2.13 0 3.84 1.72 3.84 3.84s-1.72 3.84-3.84 3.84z" fill="#FFF"/>
    </svg>
);

export const BtcIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="16" fill="#F7931A"/>
        <path d="M22.61 17.39c.69-2.83-1.2-5.1-4.22-5.75v-2.3h-2.07v2.18c-.8 0-1.58.07-2.35.21v-2.39h-2.07v2.66c-1.85.67-3.23 2.4-3.5 4.5h2.2c.22-1.22 1.23-2.18 2.62-2.18.9 0 1.3.36 1.3.86 0 .49-.4.79-1.2.98-.92.22-2.35.53-2.35 2.1 0 1.25 1.05 2.14 2.42 2.14 1.6 0 2.5-.9 2.7-2.34h-2.1c-.14.6-.66 1.02-1.34 1.02-.62 0-.9-.3-.9-.72 0-.46.34-.68 1.25-.88.9-.2 2.4-.53 2.4-2.18zm-3.04 2.5c-.2 1.3-1.2 2.23-2.58 2.23-1.6 0-2.66-1-2.66-2.4 0-1.36 1.1-2.2 2.7-2.2.8 0 1.5.2 2.1.5.2.1.3.2.44.3zm.02-6.52c-.5-.2-1.1-.3-1.7-.3-1.5 0-2.7.9-2.7 2.1 0 1.1.9 1.9 2.4 1.9.7 0 1.4-.2 2-.5z" fill="#FFF"/>
    </svg>
);

export const EthIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="16" fill="#627EEA"/>
        <path d="M16 5.45L15.82 6v13.63l.18.09 6.27-3.79L16 5.45z" fill="#FFF" fillOpacity=".6"/>
        <path d="M16 5.45L9.73 15.93l6.27 3.79V5.45z" fill="#FFF"/>
        <path d="M16 20.45l-.14.17v5.52l.14-.07 6.27-9.45-6.27 3.83z" fill="#FFF" fillOpacity=".6"/>
        <path d="M16 26.14V20.45l-6.27-3.83L16 26.14z" fill="#FFF"/>
        <path d="M16 19.22l6.27-3.79-6.27-2.31v6.1z" fill="#FFF" fillOpacity=".2"/>
        <path d="M9.73 15.43l6.27 3.79v-6.1L9.73 15.43z" fill="#FFF" fillOpacity=".6"/>
    </svg>
);

export const assetIcons: { [key: string]: React.FC<{ className?: string }> } = {
    USDT: UsdtIcon,
    USDC: UsdcIcon,
    BUSD: BusdIcon,
    DAI: DaiIcon,
    BTC: BtcIcon,
    ETH: EthIcon,
};
