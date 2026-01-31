
import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon } from './icons/HomeIcon';
import { WalletIcon } from './icons/WalletIcon';
import { P2PIcon } from './icons/P2PIcon';
import { SwapIcon } from './icons/SwapIcon';
import { TradesIcon } from './icons/TradesIcon';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useHaptic } from '../hooks/useHaptic';

const BottomNav: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { triggerHaptic } = useHaptic();
  
  const activeColor = theme === 'gold' ? 'text-[#F0B90B]' : 'text-[#0ECB81]';
  const inactiveColor = 'text-[#848E9C]';

  const navItems = [
    { path: '/', label: t('home'), icon: HomeIcon },
    { path: '/swap', label: t('swap'), icon: SwapIcon },
    { path: '/p2p', label: 'P2P', icon: P2PIcon, isMiddle: true },
    { path: '/trades', label: t('trades'), icon: TradesIcon },
    { path: '/wallet', label: t('wallet'), icon: WalletIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0B0E11]/95 backdrop-blur-xl border-t border-[#2B3139] pb-safe">
        <div className="flex justify-between items-end w-full max-w-md mx-auto h-[60px] px-2 relative">
            {navItems.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => triggerHaptic('selection')}
                    className={({ isActive }) => `
                        flex flex-col items-center justify-end w-1/5 h-full pb-2 relative group cursor-pointer
                        ${isActive ? activeColor : inactiveColor}
                    `}
                >
                    {({ isActive }) => (
                        item.isMiddle ? (
                            <>
                                {/* Raised Circle for P2P */}
                                <div className={`
                                    absolute -top-8 left-1/2 -translate-x-1/2
                                    w-16 h-16 rounded-full 
                                    bg-[#1E2026] border-[4px] border-[#2B3139]
                                    flex items-center justify-center
                                    shadow-xl shadow-black/60
                                    transition-all duration-300 ease-out z-20
                                    ${isActive 
                                        ? (theme === 'gold' ? 'text-brand-yellow ring-2 ring-brand-yellow/20' : 'text-brand-green ring-2 ring-brand-green/20')
                                        : 'text-[#FEFEFE] hover:scale-105 hover:border-[#848E9C]'
                                    }
                                `}>
                                    <item.icon className="w-7 h-7" />
                                </div>
                                {/* Label */}
                                <span className={`text-[10px] font-bold mt-9 transition-colors duration-300 ${isActive ? activeColor : 'text-[#848E9C]'}`}>
                                    {item.label}
                                </span>
                            </>
                        ) : (
                            <>
                                <item.icon className={`w-6 h-6 mb-1 transition-transform duration-200 ${isActive ? 'scale-110 stroke-[2px]' : 'stroke-[1.5px] group-hover:scale-105'}`} />
                                <span className="text-[10px] font-bold">
                                    {item.label}
                                </span>
                            </>
                        )
                    )}
                </NavLink>
            ))}
        </div>
    </nav>
  );
};

export default BottomNav;
