import React from 'react';

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
