
import React from 'react';

export const TunisiaFlagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 24 12" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path fill="#E70013" d="M0 0h24v12H0z"/>
        <circle cx="12" cy="6" r="3" fill="#fff"/>
        <g fill="#E70013">
            <path d="M12 7.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/>
            <path d="M12.45 6.9a1.2 1.2 0 1 0 0-1.8 1.2 1.2 0 0 0 0 1.8Z" fill="#fff"/>
            <path d="m13.8 4.77.15.42h.44l-.36.26.14.42-.36-.26-.36.26.14-.42-.36-.26h.44l.15-.42Z"/>
        </g>
    </svg>
);
