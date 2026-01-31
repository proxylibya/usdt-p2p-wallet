
import React, { useMemo } from 'react';

interface SparklineProps {
    data: number[];
    color: string;
    width?: number;
    height?: number;
    fill?: boolean;
}

export const Sparkline: React.FC<SparklineProps> = ({ data, color, width = 100, height = 35, fill = true }) => {
    const points = useMemo(() => {
        if (!data || data.length < 2) return '';

        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;
        const padding = 2; // padding to avoid clipping stroke

        // Map data points to SVG coordinates
        const pts = data.map((val, i) => {
            const x = (i / (data.length - 1)) * width;
            // Invert Y axis because SVG coords start top-left
            const y = height - padding - ((val - min) / range) * (height - padding * 2);
            return `${x},${y}`;
        }).join(' ');
        
        return pts;
    }, [data, width, height]);

    // Unique ID for gradient, memoized based on color to prevent re-renders on same-color updates
    const gradientId = useMemo(() => 
        `gradient-${color.replace(/[^a-zA-Z0-9]/g, '')}`,
    [color]);

    if (!points) return null;

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
            <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
            </defs>
            {fill && (
                <path
                    d={`M0,${height} L${points.split(' ')[0]} ${points} L${width},${height} Z`}
                    fill={`url(#${gradientId})`}
                    stroke="none"
                />
            )}
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};
