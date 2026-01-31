
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { User, Camera, Save, Edit2, Mail } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { PhoneInput } from '../components/PhoneInput';
import { userService } from '../services';

const EditProfileScreen: React.FC = () => {
    const { user, updateUser } = useAuth();
    const { t } = useLanguage();
    const { primaryColor } = useTheme();
    const navigate = useNavigate();
    const { addNotification } = useNotifications();

    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phoneNumber || '');
    const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!user) return null; 

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            
            // Show preview immediately
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
            
            // Upload to server
            setIsUploading(true);
            try {
                const response = await userService.uploadAvatar(file);
                if (response.success && response.data) {
                    setAvatarUrl(response.data.url);
                    addNotification({
                        icon: 'success',
                        title: t('success'),
                        message: 'Image uploaded successfully'
                    });
                } else {
                    addNotification({
                        icon: 'error',
                        title: t('error'),
                        message: response.error || 'Failed to upload image'
                    });
                    setAvatarUrl(user?.avatarUrl || '');
                    setSelectedFile(null);
                }
            } catch (error) {
                addNotification({
                    icon: 'error',
                    title: t('error'),
                    message: 'Failed to upload image'
                });
                setAvatarUrl(user?.avatarUrl || '');
                setSelectedFile(null);
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleCameraClick = () => {
        fileInputRef.current?.click();
    };

    const handleSaveChanges = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        
        try {
            const response = await userService.updateProfile({ name, email, avatarUrl });
            
            if (response.success && response.data) {
                updateUser({ name, email, phoneNumber: phone, avatarUrl });
                
                addNotification({
                    icon: 'success',
                    title: t('success'),
                    message: 'Profile updated successfully.'
                });
                navigate(-1);
            } else {
                addNotification({
                    icon: 'error',
                    title: t('error'),
                    message: response.error || 'Failed to update profile'
                });
            }
        } catch (error) {
            addNotification({
                icon: 'error',
                title: t('error'),
                message: 'Failed to update profile'
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <PageLayout title={t('edit_profile')}>
            <form className="flex flex-col h-full" onSubmit={handleSaveChanges}>
                <div className="flex-grow space-y-8 px-2 pt-4">
                    
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center">
                        <div className="relative group cursor-pointer" onClick={isUploading ? undefined : handleCameraClick}>
                            <div className={`w-28 h-28 rounded-full p-1 border-2 border-dashed border-${primaryColor} flex items-center justify-center`}>
                                <div className="w-full h-full rounded-full overflow-hidden bg-background-tertiary relative">
                                    <img 
                                        src={avatarUrl} 
                                        alt="User Avatar" 
                                        className="w-full h-full object-cover" 
                                    />
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        {isUploading ? (
                                            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <Camera className="w-8 h-8 text-white" />
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className={`absolute bottom-0 right-0 w-8 h-8 bg-${primaryColor} rounded-full flex items-center justify-center border-4 border-background-primary`}>
                                <Edit2 className="w-3 h-3 text-background-primary" />
                            </div>
                        </div>
                        <p className="text-xs text-text-secondary mt-3 font-medium">
                            {isUploading ? 'Uploading...' : t('upload_new_photo')}
                        </p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleAvatarChange}
                            accept="image/*"
                            style={{ display: 'none' }}
                        />
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-wide ms-1" htmlFor="fullname">{t('full_name')}</label>
                            <div className="relative">
                                <input
                                    id="fullname"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-background-secondary border border-border-divider rounded-xl p-4 ps-12 focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-primary focus:outline-none transition-all text-text-primary font-medium"
                                    style={{'--tw-ring-color': `var(--tw-color-${primaryColor})`} as React.CSSProperties}
                                />
                                <User className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-wide ms-1" htmlFor="email">{t('email_address')}</label>
                            <div className="relative">
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-background-secondary border border-border-divider rounded-xl p-4 ps-12 focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-primary focus:outline-none transition-all text-text-primary font-medium"
                                    style={{'--tw-ring-color': `var(--tw-color-${primaryColor})`} as React.CSSProperties}
                                />
                                <Mail className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-wide ms-1" htmlFor="phone">{t('phone_number')}</label>
                            <PhoneInput 
                                value={phone}
                                onChange={setPhone}
                            />
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="mt-auto pt-6 pb-2">
                    <button 
                        type="submit" 
                        disabled={isSaving || !name.trim()}
                        className={`w-full p-4 rounded-xl text-lg font-bold text-background-primary flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 bg-${primaryColor}`}
                    >
                        {isSaving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-background-primary border-t-transparent rounded-full animate-spin"></div>
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                <span>{t('save_changes')}</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </PageLayout>
    );
};

export default EditProfileScreen;
