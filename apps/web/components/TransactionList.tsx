
import React, { useState, useRef, memo } from 'react';
import { Link } from 'react-router-dom';
import { Transaction, TransactionType } from '../types';
import { ArrowDownLeftIcon } from './icons/ArrowDownLeftIcon';
import { ArrowUpRightIcon } from './icons/ArrowUpRightIcon';
import { useLanguage } from '../context/LanguageContext';
import { Trash2, ArrowRightLeft, Repeat } from 'lucide-react';

const getTransactionIcon = (type: TransactionType) => {
    const isIncome = [TransactionType.DEPOSIT, TransactionType.SWAP_IN, TransactionType.P2P_BUY].includes(type);
    
    if (type === TransactionType.SWAP_IN || type === TransactionType.SWAP_OUT) {
         return <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0"><ArrowRightLeft className="w-5 h-5 text-blue-500" /></div>
    }
    if (type === TransactionType.P2P_BUY || type === TransactionType.P2P_SELL) {
         return <div className="w-10 h-10 rounded-full bg-brand-yellow/10 flex items-center justify-center flex-shrink-0"><Repeat className="w-5 h-5 text-brand-yellow" /></div>
    }
    if (type === TransactionType.TRANSFER) {
         return <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0"><ArrowRightLeft className="w-5 h-5 text-purple-500" /></div>
    }

    if (isIncome) {
        return <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0"><ArrowDownLeftIcon className="w-5 h-5 text-success rtl:rotate-180" /></div>
    }
    return <div className="w-10 h-10 rounded-full bg-background-primary border border-border-divider flex items-center justify-center flex-shrink-0"><ArrowUpRightIcon className="w-5 h-5 text-text-primary rtl:rotate-180" /></div>
};

const SWIPE_WIDTH = 80; 
const SWIPE_SENSITIVITY = 10; 

const SwipeableTransactionItem: React.FC<{ transaction: Transaction; onDelete?: (id: string) => void }> = memo(({ transaction, onDelete }) => {
    const { t } = useLanguage();
    const linkRef = useRef<HTMLAnchorElement>(null);
    const swipedRef = useRef(false);

    const [isSwiping, setIsSwiping] = useState(false);
    const [startX, setStartX] = useState(0);
    const [translateX, setTranslateX] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!onDelete) return;
        setStartX(e.clientX);
        setIsSwiping(true);
        swipedRef.current = false;
        if (linkRef.current) linkRef.current.style.transition = 'none';
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isSwiping) return;
        e.preventDefault();
        const currentX = e.clientX;
        const delta = currentX - startX;

        if (Math.abs(delta) > SWIPE_SENSITIVITY) {
            swipedRef.current = true;
        }
        
        const newTranslateX = Math.max(-SWIPE_WIDTH, Math.min(0, translateX + delta));
        
        if (delta < 0 || (delta > 0 && translateX < 0)) {
            setTranslateX(newTranslateX);
        }
    };
    
    const handlePointerUp = () => {
        if (!isSwiping) return;
        setIsSwiping(false);
        if (linkRef.current) linkRef.current.style.transition = 'transform 0.3s ease-out';
        
        if (translateX < -SWIPE_WIDTH / 2) {
            setTranslateX(-SWIPE_WIDTH);
        } else {
            setTranslateX(0);
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        if (swipedRef.current) {
            e.preventDefault();
        }
    };

    const handleDelete = () => setIsDeleting(true);

    const onAnimationEnd = () => {
        if (isDeleting && onDelete) {
            onDelete(transaction.id);
        }
    };

    return (
        <div 
            className={`relative rounded-lg overflow-hidden ${isDeleting ? 'item-deleting' : ''}`}
            onAnimationEnd={onAnimationEnd}
        >
            {onDelete && (
                <div className="absolute top-0 right-0 h-full w-20 bg-error flex items-center justify-center z-0">
                    <button onClick={handleDelete} aria-label={t('delete')} className="text-white p-4">
                        <Trash2 size={24} />
                    </button>
                </div>
            )}
            <Link
                to={`/wallet/transaction/${transaction.id}`}
                onClick={handleClick}
                draggable={false}
                ref={linkRef}
                style={{ transform: `translateX(${translateX}px)`, touchAction: 'pan-y' }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="block bg-background-secondary cursor-pointer border-b border-border-divider/30 last:border-0 active:bg-background-tertiary/50 transition-colors relative z-10"
            >
                <div className="p-4 flex gap-3">
                    {/* Icon Column */}
                    <div className="pt-1">
                        {getTransactionIcon(transaction.type)}
                    </div>

                    {/* Main Content Column */}
                    <div className="flex-grow min-w-0 flex flex-col gap-1 text-start">
                        
                        {/* Top Row: Title & Amount */}
                        <div className="flex justify-between items-start">
                            <h4 className="font-bold text-text-primary text-sm truncate pe-2">
                                {t(transaction.type.toLowerCase().replace(/ /g, '_') as any)}
                            </h4>
                            {/* Force LTR direction for amounts to prevent sign flipping in Arabic */}
                            <span className={`font-mono font-bold text-sm whitespace-nowrap ${transaction.amount > 0 ? 'text-success' : 'text-text-primary'}`} dir="ltr">
                                {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} <span className="text-xs text-text-secondary">{transaction.asset}</span>
                            </span>
                        </div>

                        {/* Address / Details Row */}
                        {(transaction.toAddress || transaction.fromAddress) && (
                            <p className="text-xs text-text-secondary font-mono truncate opacity-80 text-start">
                                {transaction.toAddress 
                                    ? `To: ${transaction.toAddress.substring(0, 6)}...${transaction.toAddress.substring(transaction.toAddress.length - 4)}`
                                    : `From: ${transaction.fromAddress?.substring(0, 6)}...${transaction.fromAddress?.substring(transaction.fromAddress.length - 4)}`
                                }
                            </p>
                        )}

                        {/* Bottom Row: Date, Fee, Status */}
                        <div className="flex justify-between items-center mt-1">
                            <span className="text-[10px] text-text-secondary">{transaction.date}</span>
                            
                            <div className="flex items-center gap-2">
                                {transaction.networkFee && transaction.networkFee > 0 && (
                                    <span className="text-[10px] text-text-secondary bg-background-tertiary px-1.5 py-0.5 rounded">
                                        Fee: {transaction.networkFee}
                                    </span>
                                )}
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    transaction.status === 'Completed' ? 'bg-success/10 text-success' : 
                                    transaction.status === 'Pending' ? 'bg-brand-yellow/10 text-brand-yellow' : 
                                    'bg-error/10 text-error'
                                }`}>
                                    {t(transaction.status.toLowerCase() as any)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
});

export const TransactionList: React.FC<{ transactions: Transaction[]; onDelete?: (id: string) => void }> = ({ transactions, onDelete }) => {
    return (
        <div className="space-y-2">
            {transactions.map(tx => (
                <SwipeableTransactionItem key={tx.id} transaction={tx} onDelete={onDelete} />
            ))}
        </div>
    );
};