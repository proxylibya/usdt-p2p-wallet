
import React, { useState, useRef, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useLiveData } from '../../context/LiveDataContext';
import { ADMIN_USERS } from '../../constants';
import { DataTable, TableColumn } from '../../components/admin/DataTable';
import { AdminUser, KYCStatus } from '../../types';
import { MoreVertical, User, Ban, CheckCircle, XCircle, Eye } from 'lucide-react';
import { UserDetailsModal } from '../../components/admin/UserDetailsModal';

const UsersScreen: React.FC = () => {
    const { t } = useLanguage();
    
    // Access authenticated user context
    const { user: currentUser, updateKycStatus } = useAuth();
    // Access live data to calculate real-time volume
    const { transactions } = useLiveData();
    
    // Calculate current user's volume based on live transactions
    const currentUserVolume = useMemo(() => {
        return transactions.reduce((acc, tx) => acc + Math.abs(tx.usdValue), 0);
    }, [transactions]);

    const [adminUsers, setAdminUsers] = useState<AdminUser[]>(ADMIN_USERS);
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Merge static admin users with the real current user
    const allUsers = useMemo(() => {
        const users = [...adminUsers];
        
        if (currentUser) {
            // Check if current user is already in the list (by ID) to avoid dupes
            const exists = users.find(u => u.id === currentUser.id);
            if (!exists) {
                // Map local User type to AdminUser type
                const realUserAsAdminUser: AdminUser = {
                    id: currentUser.id,
                    name: currentUser.name || 'Me',
                    phoneNumber: currentUser.phoneNumber,
                    avatarUrl: currentUser.avatarUrl,
                    status: 'Active',
                    joinDate: new Date().toISOString().split('T')[0], // Today
                    lastLogin: 'Just now',
                    totalVolume: currentUserVolume,
                    kycStatus: currentUser.kycStatus
                };
                users.unshift(realUserAsAdminUser); // Add to top for visibility
            } else {
                // Update the existing entry with live volume and status if it exists
                const index = users.findIndex(u => u.id === currentUser.id);
                if (index !== -1) {
                    users[index] = { 
                        ...users[index], 
                        totalVolume: currentUserVolume, 
                        kycStatus: currentUser.kycStatus,
                        lastLogin: 'Just now'
                    };
                }
            }
        }
        return users;
    }, [adminUsers, currentUser, currentUserVolume]);

    const handleUpdateUser = (updatedUser: AdminUser) => {
        // 1. Update local list state
        setAdminUsers(prevUsers => {
            const index = prevUsers.findIndex(u => u.id === updatedUser.id);
            if (index !== -1) {
                const newUsers = [...prevUsers];
                newUsers[index] = updatedUser;
                return newUsers;
            }
            // If it's the current user (who might be unshifted dynamically), we update the base list if possible
            // or we handle the sync below.
            return prevUsers;
        });

        // 2. SYNC WITH REAL USER SESSION (Simulating Backend Update)
        // If the admin modifies the currently logged-in user (the "Me" user),
        // we directly update localStorage so the user sees the new KYC status immediately without refreshing.
        if (currentUser && updatedUser.id === currentUser.id) {
            const sessionKey = 'usdt_wallet_user_session';
            try {
                const storedSession = localStorage.getItem(sessionKey);
                if (storedSession) {
                    const sessionData = JSON.parse(storedSession);
                    const newSession = { 
                        ...sessionData, 
                        kycStatus: updatedUser.kycStatus,
                        status: updatedUser.status 
                    };
                    localStorage.setItem(sessionKey, JSON.stringify(newSession));
                    
                    // Directly update context if available to reflect changes in UI immediately
                    if (updateKycStatus) {
                        updateKycStatus(updatedUser.kycStatus);
                    }
                    
                    // Dispatch storage event to sync across tabs if needed
                    window.dispatchEvent(new Event('storage'));
                }
            } catch {
                // Failed to sync changes
            }
        }
    };
    
    const handleViewDetails = (user: AdminUser) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const columns: TableColumn<AdminUser>[] = [
        {
            header: t('user_details'),
            accessor: (user) => (
                <div className="flex items-center gap-3">
                    <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full border border-border-divider" />
                    <div>
                        <p className={`font-bold ${user.id === currentUser?.id ? 'text-brand-yellow' : 'text-text-primary'}`}>
                            {user.name} {user.id === currentUser?.id && '(You)'}
                        </p>
                        <p className="text-sm text-text-secondary">{user.phoneNumber}</p>
                    </div>
                </div>
            ),
            sortable: true,
            sortKey: 'name'
        },
        {
            header: t('status'),
            accessor: (user) => {
                const statusColor = {
                    Active: 'bg-success/20 text-success',
                    Banned: 'bg-error/20 text-error',
                    Pending: 'bg-brand-yellow/20 text-brand-yellow',
                }[user.status];
                return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>{user.status}</span>
            },
            sortable: true,
            sortKey: 'status'
        },
        {
            header: t('kyc_verification'),
            accessor: (user) => {
                const kycStatusColor = {
                    [KYCStatus.VERIFIED]: 'bg-success/20 text-success',
                    [KYCStatus.PENDING]: 'bg-brand-yellow/20 text-brand-yellow',
                    [KYCStatus.NOT_VERIFIED]: 'bg-gray-500/20 text-gray-400',
                    [KYCStatus.REJECTED]: 'bg-error/20 text-error',
                }[user.kycStatus];
                return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${kycStatusColor}`}>{user.kycStatus}</span>
            },
            sortable: true,
            sortKey: 'kycStatus'
        },
        { header: t('join_date'), accessor: 'joinDate', sortable: true },
        { 
            header: t('total_volume'),
            accessor: (user) => `$${user.totalVolume.toLocaleString()}`,
            sortable: true,
            sortKey: 'totalVolume'
        },
        {
            header: t('actions'),
            accessor: (user) => (
                <ActionsDropdown user={user} onUpdate={handleUpdateUser} onViewDetails={handleViewDetails} isCurrentUser={user.id === currentUser?.id} />
            )
        }
    ];

    return (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h1 className="text-3xl font-bold text-text-primary">{t('manage_users')}</h1>
                <p className="text-text-secondary mt-1">{t('users_screen_subtitle')}</p>
            </div>
            <DataTable
                columns={columns}
                data={allUsers}
                searchPlaceholder={t('search_users')}
                searchKeys={['name', 'phoneNumber']}
            />
            {selectedUser && (
                <UserDetailsModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    user={selectedUser}
                />
            )}
        </div>
    );
};

const ActionsDropdown: React.FC<{ user: AdminUser, onUpdate: (user: AdminUser) => void, onViewDetails: (user: AdminUser) => void, isCurrentUser: boolean }> = ({ user, onUpdate, onViewDetails, isCurrentUser }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { t } = useLanguage();
    
    const toggleBan = () => {
        if (isCurrentUser) {
            alert("You cannot ban yourself!");
            return;
        }
        onUpdate({ ...user, status: user.status === 'Banned' ? 'Active' : 'Banned' });
        setIsOpen(false);
    };

    const handleKyc = (newStatus: KYCStatus) => {
        onUpdate({ ...user, kycStatus: newStatus });
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-full hover:bg-background-tertiary transition-colors">
                <MoreVertical className="w-5 h-5 text-text-secondary" />
            </button>
            {isOpen && (
                <div className="absolute end-0 z-50 mt-2 w-48 origin-top-right rounded-md bg-background-tertiary shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden border border-border-divider">
                    <div className="py-1">
                        <button onClick={() => { onViewDetails(user); setIsOpen(false); }} className="w-full text-start flex items-center gap-2 px-4 py-3 text-sm text-text-primary hover:bg-background-secondary transition-colors">
                            <Eye className="w-4 h-4 text-text-secondary"/> {t('view_details')}
                        </button>
                        
                        {!isCurrentUser && (
                            <button onClick={toggleBan} className="w-full text-start flex items-center gap-2 px-4 py-3 text-sm text-text-primary hover:bg-background-secondary transition-colors border-t border-border-divider">
                                {user.status === 'Banned' ? <><User className="w-4 h-4 text-success"/>{t('unban_user')}</> : <><Ban className="w-4 h-4 text-error"/>{t('ban_user')}</>}
                            </button>
                        )}

                        <div className="border-t border-border-divider">
                            <p className="px-4 py-2 text-[10px] uppercase text-text-secondary font-bold">Set KYC Status</p>
                            <button onClick={() => handleKyc(KYCStatus.VERIFIED)} className="w-full text-start flex items-center gap-2 px-4 py-2 text-sm text-success hover:bg-background-secondary transition-colors"><CheckCircle className="w-4 h-4"/> {t('verified')}</button>
                            <button onClick={() => handleKyc(KYCStatus.PENDING)} className="w-full text-start flex items-center gap-2 px-4 py-2 text-sm text-brand-yellow hover:bg-background-secondary transition-colors"><MoreVertical className="w-4 h-4"/> {t('pending')}</button>
                            <button onClick={() => handleKyc(KYCStatus.REJECTED)} className="w-full text-start flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-background-secondary transition-colors"><XCircle className="w-4 h-4"/> {t('rejected')}</button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Backdrop for closing */}
            {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>}
        </div>
    );
};

export default UsersScreen;
