import React from 'react';

export const UsdtIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="16" fill="#26A17B"/>
        <path d="M16.48 8.41V23.7h3.87V18.8h2.32v-3.72h-2.32v-3.08h2.89V8.41h-6.76zm-8.07 0h6.76v3.59H12.3v11.7h-3.89V8.41z" fill="#FFF"/>
    </svg>
);
