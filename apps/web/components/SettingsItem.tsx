
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { ChevronRight } from 'lucide-react';

interface SettingsItemProps {
    icon?: React.ElementType;
    label: string;
    value?: React.ReactNode;
    onClick?: (e: React.MouseEvent) => void;
    to?: string;
    isSwitch?: boolean;
    switchState?: boolean;
    onSwitchChange?: () => void;
    subLabel?: string;
    iconColor?: string;
    iconBgColor?: string;
    destructive?: boolean;
    className?: string;
}

export const SettingsItem: React.FC<SettingsItemProps> = ({ 
    icon: Icon, 
    label, 
    value, 
    onClick, 
    to, 
    isSwitch, 
    switchState, 
    onSwitchChange, 
    subLabel, 
    iconColor, 
    iconBgColor,
    destructive,
    className
}) => {
    const { primaryColor } = useTheme();
    const navigate = useNavigate();

    const handleClick = (e: React.MouseEvent) => {
        if (isSwitch) {
             e.preventDefault();
             e.stopPropagation();
             if(onSwitchChange) {
                 onSwitchChange();
             } else if (onClick) {
                 onClick(e);
             }
             return;
        }
        
        if (to) {
            navigate(to);
        } else if (onClick) {
            onClick(e);
        }
    };

    const Component = (to || onClick || isSwitch) ? 'button' : 'div';

    return (
        <Component
            onClick={handleClick}
            className={`w-full flex items-center justify-between p-5 transition-colors border-b border-border-divider/50 last:border-0 group outline-none bg-transparent text-start cursor-pointer hover:bg-background-tertiary/30 active:bg-background-tertiary/50 min-h-[80px] ${className || ''}`}
            type={Component === 'button' ? 'button' : undefined}
            role={isSwitch ? 'switch' : 'button'}
            aria-checked={isSwitch ? switchState : undefined}
        >
            <div className="flex items-center gap-4 min-w-0 flex-1 overflow-hidden">
                {Icon && (
                    <div className={`p-3 rounded-xl flex-shrink-0 ${iconBgColor || 'bg-background-tertiary'} ${destructive ? 'text-error' : (iconColor || 'text-text-secondary group-hover:text-text-primary')} transition-colors`}>
                        <Icon className={`w-6 h-6`} />
                    </div>
                )}
                <div className="flex flex-col items-start min-w-0 flex-1 justify-center py-1">
                    <span className={`text-sm font-bold w-full leading-tight truncate ${destructive ? 'text-error' : 'text-text-primary'}`}>{label}</span>
                    {subLabel && (
                        <span className="text-xs text-text-secondary/80 leading-relaxed mt-1.5 break-words w-full whitespace-normal">
                            {subLabel}
                        </span>
                    )}
                </div>
            </div>
            
            <div className="flex items-center gap-3 flex-shrink-0 pl-3 rtl:pl-0 rtl:pr-3">
                {value && (
                    <div className="flex-shrink-0">
                        {typeof value === 'string' ? (
                            <span className="text-xs text-text-secondary font-medium bg-background-primary/60 px-2.5 py-1 rounded-lg border border-white/5 whitespace-nowrap">{value}</span>
                        ) : (
                            value
                        )}
                    </div>
                )}
                {isSwitch ? (
                    <div className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 border border-transparent ${switchState ? `bg-${primaryColor}` : 'bg-background-tertiary border-border-divider'}`}>
                        <span className={`absolute w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${switchState ? 'translate-x-6 rtl:-translate-x-6' : 'translate-x-1 rtl:-translate-x-1'}`} />
                    </div>
                ) : (
                    (to || onClick) && <ChevronRight className="w-5 h-5 text-text-secondary/50 rtl:rotate-180 group-hover:text-text-primary transition-colors" />
                )}
            </div>
        </Component>
    );
};
