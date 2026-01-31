import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectFieldProps {
    valueLabel: string;
    onClick: () => void;
    placeholder?: string;
    leftIcon?: React.ReactNode;
    disabled?: boolean;
    className?: string;
    style?: React.CSSProperties;
}

export const SelectField: React.FC<SelectFieldProps> = ({
    valueLabel,
    onClick,
    placeholder,
    leftIcon,
    disabled = false,
    className,
    style,
}) => {
    const defaultPadding = leftIcon
        ? 'p-4 ltr:pl-14 ltr:pr-10 rtl:pr-14 rtl:pl-10'
        : 'p-4 ltr:pl-4 ltr:pr-10 rtl:pr-4 rtl:pl-10';

    const mergedClassName = className
        ? `relative ${className}`
        : `relative w-full bg-background-secondary border border-border-divider rounded-xl ${defaultPadding} focus:ring-2 focus:outline-none transition-colors font-bold text-text-primary text-start disabled:opacity-60 disabled:cursor-not-allowed`;

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={mergedClassName}
            style={style}
        >
            {leftIcon ? (
                <div className="absolute inset-y-0 ltr:left-4 rtl:right-4 flex items-center pointer-events-none">
                    {leftIcon}
                </div>
            ) : null}

            <div className="flex items-center justify-between">
                <span className="truncate">{valueLabel || placeholder || ''}</span>
                <span className="ltr:ml-3 rtl:mr-3 flex-shrink-0 text-text-secondary">
                    <ChevronDown className="w-5 h-5" />
                </span>
            </div>
        </button>
    );
};
