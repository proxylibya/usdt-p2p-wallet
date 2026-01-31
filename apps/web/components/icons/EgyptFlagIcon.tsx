
import React from 'react';

export const EgyptFlagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 24 12" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M0 0h24v4h-24z" fill="#ce1126"/>
        <path d="M0 4h24v4h-24z" fill="#fff"/>
        <path d="M0 8h24v4h-24z"/>
        <g transform="translate(10.5 4.5) scale(.5)">
            <path fill="#c09300" d="M4 3h1v7H4z"/>
            <path fill="#c09300" d="M1 3h1v1a2 2 0 004 0V3h1v1a3 3 0 11-6 0V3z"/>
            <path fill="#c09300" d="M1 0h5v3H1z"/>
            <path d="M1 1h5v1H1z"/>
        </g>
    </svg>
);
