
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../components/PageLayout';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { KYCStatus } from '../../types';
import { CheckCircle, Clock, XCircle, Camera, Shield, Lock, CreditCard, Book, ChevronRight, Check, User, ArrowLeft, Calendar } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { userService } from '../../services';

type KycStep = 'select_document' | 'personal_details' | 'upload_front' | 'upload_back' | 'selfie' | 'review' | 'status';
type DocumentType = 'id_card' | 'passport';

const LimitsComparison = () => (
    <div className="bg-background-secondary rounded-xl border border-border-divider overflow-hidden mb-6">
        <div className="grid grid-cols-3 bg-background-tertiary/50 text-[10px] font-bold text-text-secondary uppercase p-3 border-b border-border-divider tracking-wider">
            <span>Feature</span>
            <span className="text-center">Current</span>
            <span className="text-end text-brand-yellow">Verified</span>
        </div>
        <div className="p-4 text-xs space-y-4">
            <div className="grid grid-cols-3 items-center">
                <span className="text-text-secondary font-medium">P2P Trading</span>
                <span className="text-center text-text-primary">$100 / day</span>
                <span className="text-end font-bold text-success">Unlimited</span>
            </div>
            <div className="grid grid-cols-3 items-center">
                <span className="text-text-secondary font-medium">Withdrawal</span>
                <span className="text-center text-text-primary">500 USDT</span>
                <span className="text-end font-bold text-success">1M USDT</span>
            </div>
            <div className="grid grid-cols-3 items-center">
                <span className="text-text-secondary font-medium">Fiat Deposit</span>
                <span className="text-center text-text-secondary"><XCircle className="w-3 h-3 mx-auto inline" /></span>
                <span className="text-end font-bold text-success"><Check className="w-3 h-3 ms-auto inline" /></span>
            </div>
             <div className="grid grid-cols-3 items-center">
                <span className="text-text-secondary font-medium">Card Payment</span>
                <span className="text-center text-text-secondary"><XCircle className="w-3 h-3 mx-auto inline" /></span>
                <span className="text-end font-bold text-success"><Check className="w-3 h-3 ms-auto inline" /></span>
            </div>
        </div>
    </div>
);

const KYCScreen: React.FC = () => {
    const { user, updateKycStatus } = useAuth();
    const { t } = useLanguage();
    const { primaryColor } = useTheme();
    const navigate = useNavigate();
    const { addNotification } = useNotifications();

    const [step, setStep] = useState<KycStep>(
        user?.kycStatus === KYCStatus.NOT_VERIFIED || user?.kycStatus === KYCStatus.REJECTED 
        ? 'select_document' 
        : 'status'
    );
    const [docType, setDocType] = useState<DocumentType | null>(null);
    
    // Form Data
    const [details, setDetails] = useState({
        fullName: user?.name || '',
        docNumber: '',
        dob: ''
    });

    const [frontImage, setFrontImage] = useState<string | null>(null);
    const [backImage, setBackImage] = useState<string | null>(null);
    const [selfieImage, setSelfieImage] = useState<string | null>(null);
    
    // Progress Calculation
    // 1: Select, 2: Details, 3: Docs/Selfie, 4: Review
    const getCurrentProgress = () => {
        switch(step) {
            case 'select_document': return 1;
            case 'personal_details': return 2;
            case 'upload_front': 
            case 'upload_back': 
            case 'selfie': return 3;
            case 'review': return 4;
            default: return 0;
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back' | 'selfie') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result as string;
                if (type === 'front') setFrontImage(result);
                else if (type === 'back') setBackImage(result);
                else setSelfieImage(result);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleNext = () => {
        if (step === 'select_document') {
            setStep('personal_details');
        } else if (step === 'personal_details') {
            setStep('upload_front');
        } else if (step === 'upload_front') {
            if (docType === 'id_card') setStep('upload_back');
            else setStep('selfie');
        } else if (step === 'upload_back') {
            setStep('selfie');
        } else if (step === 'selfie') {
            setStep('review');
        }
    };

    const handleBack = () => {
        if (step === 'personal_details') setStep('select_document');
        else if (step === 'upload_front') setStep('personal_details');
        else if (step === 'upload_back') setStep('upload_front');
        else if (step === 'selfie') {
            if (docType === 'id_card') setStep('upload_back');
            else setStep('upload_front');
        } else if (step === 'review') setStep('selfie');
        else navigate(-1);
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const response = await userService.submitKyc({
                documentType: docType || 'id_card',
                documentNumber: details.docNumber,
                frontImage: frontImage || '',
                backImage: docType === 'id_card' ? backImage || undefined : undefined,
                selfieImage: selfieImage || ''
            });

            if (response.success) {
                updateKycStatus(KYCStatus.PENDING);
                addNotification({ icon: 'success', title: t('success'), message: 'Verification Submitted.' });
                setStep('status');
            } else {
                addNotification({ icon: 'error', title: t('error'), message: response.error || 'Failed to submit KYC' });
            }
        } catch {
            addNotification({ icon: 'error', title: t('error'), message: 'Network error occurred' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isDetailsValid = details.fullName.length > 3 && details.docNumber.length > 4 && details.dob;

    // --- Status View (Already Verified or Pending) ---
    if (step === 'status') {
        const status = user?.kycStatus || KYCStatus.NOT_VERIFIED;
        const isVerified = status === KYCStatus.VERIFIED;
        const isPending = status === KYCStatus.PENDING;
        
        return (
            <PageLayout title={t('verification_status')} noPadding>
                <div className="flex flex-col h-full p-6 bg-background-primary">
                    <div className="flex-grow flex flex-col items-center pt-10">
                        {/* Certificate Style Card */}
                        <div className={`relative w-full max-w-sm p-8 rounded-2xl border-2 ${isVerified ? 'border-success bg-success/5' : (isPending ? 'border-brand-yellow bg-brand-yellow/5' : 'border-error bg-error/5')} text-center mb-10`}>
                            <div className={`absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full flex items-center justify-center border-4 border-background-primary ${isVerified ? 'bg-success' : (isPending ? 'bg-brand-yellow' : 'bg-error')}`}>
                                {isVerified ? <CheckCircle className="w-6 h-6 text-white" /> : (isPending ? <Clock className="w-6 h-6 text-black" /> : <XCircle className="w-6 h-6 text-white" />)}
                            </div>
                            
                            <h2 className="text-2xl font-black text-text-primary mt-4 mb-2">{t(status.toLowerCase().replace(' ', '_') as any)}</h2>
                            <p className="text-sm text-text-secondary mb-6">
                                {isVerified 
                                    ? "Your identity has been verified. You now have access to all platform features." 
                                    : (isPending ? "Your documents are currently under review. This usually takes 24 hours." : "Verification failed. Please try again.")}
                            </p>
                            
                            <div className="space-y-3 text-start bg-background-primary p-4 rounded-xl border border-border-divider/50">
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-secondary">Name</span>
                                    <span className="font-bold text-text-primary">{user?.name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-secondary">UID</span>
                                    <span className="font-mono text-text-primary">{user?.id.substring(0,8)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-secondary">Country</span>
                                    <span className="font-bold text-text-primary">{user?.countryCode}</span>
                                </div>
                            </div>
                        </div>

                        <div className="w-full max-w-sm">
                            <h3 className="text-sm font-bold text-text-primary mb-3">Your Limits</h3>
                            <LimitsComparison />
                        </div>
                    </div>
                    
                    <button onClick={() => navigate('/profile')} className="w-full p-4 bg-background-secondary rounded-xl font-bold text-text-primary border border-border-divider hover:bg-background-tertiary transition-colors">
                        Back to Profile
                    </button>
                </div>
            </PageLayout>
        );
    }

    // --- Helper Component for Upload Box ---
    const UploadBox = ({ 
        label, 
        image, 
        onUpload 
    }: { 
        label: string, 
        image: string | null, 
        onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void 
    }) => (
        <div className="flex flex-col h-full animate-fadeIn">
             <h1 className="text-2xl font-bold text-text-primary mb-2">{label}</h1>
             <p className="text-text-secondary mb-6 text-sm">Ensure all corners are visible and text is readable.</p>

             <div className="flex-grow flex flex-col items-center justify-center border-2 border-dashed border-border-divider rounded-2xl bg-background-secondary relative overflow-hidden group hover:border-brand-yellow/50 transition-colors">
                <input type="file" className="absolute inset-0 opacity-0 z-10 cursor-pointer" onChange={onUpload} accept="image/*" />
                
                {image ? (
                    <img src={image} className="w-full h-full object-contain p-4" alt="Preview" />
                ) : (
                    <div className="text-center p-6">
                        <div className="w-16 h-16 bg-background-tertiary rounded-full flex items-center justify-center mx-auto mb-4 text-brand-yellow">
                            <Camera className="w-8 h-8" />
                        </div>
                        <p className="font-bold text-text-primary mb-1">{t('click_to_upload')}</p>
                        <p className="text-xs text-text-secondary">JPG, PNG (Max 5MB)</p>
                    </div>
                )}
             </div>
        </div>
    );

    // --- Wizard Flow ---
    return (
        <PageLayout 
            title={t('kyc_verification')} 
            noPadding 
            action={step !== 'select_document' ? (
                <button onClick={handleBack} className="p-2 text-text-secondary hover:text-text-primary">
                    <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
                </button>
            ) : undefined}
        >
            <div className="p-4 flex flex-col h-full bg-background-primary">
                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex gap-2">
                        {[1, 2, 3, 4].map(i => {
                            const isActive = i <= getCurrentProgress();
                            return (
                                <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${isActive ? 'bg-brand-yellow' : 'bg-background-tertiary'}`}></div>
                            );
                        })}
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] text-text-secondary uppercase font-bold tracking-wider">
                        <span>Select</span>
                        <span>Info</span>
                        <span>Docs</span>
                        <span>Finish</span>
                    </div>
                </div>

                <div className="flex-grow flex flex-col">
                    {step === 'select_document' && (
                        <div className="animate-fadeIn">
                            <h1 className="text-2xl font-bold text-text-primary mb-2">Let's verify your identity</h1>
                            <p className="text-text-secondary mb-8 text-sm">Select a document type to scan. This helps us ensure the safety of your account.</p>
                            
                            <div className="space-y-3">
                                <button 
                                    onClick={() => { setDocType('id_card'); handleNext(); }} 
                                    className="w-full flex items-center justify-between p-5 bg-background-secondary rounded-xl border border-border-divider hover:border-brand-yellow hover:bg-background-tertiary transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-full bg-background-tertiary text-text-secondary group-hover:text-${primaryColor} group-hover:bg-${primaryColor}/10 transition-colors`}>
                                            <CreditCard size={24} />
                                        </div>
                                        <div className="text-start">
                                            <span className="font-bold block text-base text-text-primary">{t('id_card')}</span>
                                            <span className="text-xs text-text-secondary">Front & Back scan required</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-text-secondary" />
                                </button>

                                <button 
                                    onClick={() => { setDocType('passport'); handleNext(); }} 
                                    className="w-full flex items-center justify-between p-5 bg-background-secondary rounded-xl border border-border-divider hover:border-brand-yellow hover:bg-background-tertiary transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-full bg-background-tertiary text-text-secondary group-hover:text-${primaryColor} group-hover:bg-${primaryColor}/10 transition-colors`}>
                                            <Book size={24} />
                                        </div>
                                        <div className="text-start">
                                            <span className="font-bold block text-base text-text-primary">{t('passport')}</span>
                                            <span className="text-xs text-text-secondary">Face page scan required</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-text-secondary" />
                                </button>
                            </div>

                            <div className="mt-8">
                                <h3 className="text-sm font-bold text-text-primary mb-3 px-1">Benefits of Verification</h3>
                                <LimitsComparison />
                            </div>
                        </div>
                    )}

                    {step === 'personal_details' && (
                        <div className="animate-fadeIn space-y-6">
                            <div>
                                <h1 className="text-2xl font-bold text-text-primary mb-2">Personal Information</h1>
                                <p className="text-text-secondary mb-6 text-sm">Please enter your details exactly as they appear on your ID.</p>
                                
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-text-secondary ms-1">Full Name</label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                value={details.fullName}
                                                onChange={e => setDetails({...details, fullName: e.target.value})}
                                                className="w-full bg-background-secondary border border-border-divider rounded-xl p-3.5 ps-10 focus:outline-none focus:border-brand-yellow text-text-primary transition-colors"
                                                placeholder="e.g. John Doe"
                                            />
                                            <User className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-text-secondary ms-1">Document Number</label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                value={details.docNumber}
                                                onChange={e => setDetails({...details, docNumber: e.target.value})}
                                                className="w-full bg-background-secondary border border-border-divider rounded-xl p-3.5 ps-10 focus:outline-none focus:border-brand-yellow text-text-primary transition-colors"
                                                placeholder="e.g. A12345678"
                                            />
                                            <CreditCard className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-text-secondary ms-1">Date of Birth</label>
                                        <div className="relative">
                                            <input 
                                                type="date" 
                                                value={details.dob}
                                                onChange={e => setDetails({...details, dob: e.target.value})}
                                                className="w-full bg-background-secondary border border-border-divider rounded-xl p-3.5 ps-10 focus:outline-none focus:border-brand-yellow text-text-primary transition-colors"
                                                style={{ colorScheme: 'dark' }}
                                            />
                                            <Calendar className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'upload_front' && (
                        <UploadBox 
                            label={t('upload_front_side')} 
                            image={frontImage} 
                            onUpload={(e) => handleImageUpload(e, 'front')} 
                        />
                    )}

                    {step === 'upload_back' && (
                        <UploadBox 
                            label={t('upload_back_side')} 
                            image={backImage} 
                            onUpload={(e) => handleImageUpload(e, 'back')} 
                        />
                    )}

                    {step === 'selfie' && (
                        <div className="flex flex-col h-full animate-fadeIn">
                             <h1 className="text-2xl font-bold text-text-primary mb-2">{t('take_selfie')}</h1>
                             <p className="text-text-secondary mb-6 text-sm">{t('face_camera')}. No glasses or hats.</p>

                             <div className="flex-grow flex flex-col items-center justify-center border-2 border-dashed border-border-divider rounded-2xl bg-background-secondary relative overflow-hidden group hover:border-brand-yellow/50 transition-colors">
                                <input type="file" className="absolute inset-0 opacity-0 z-10 cursor-pointer" onChange={(e) => handleImageUpload(e, 'selfie')} accept="image/*" capture="user" />
                                
                                {selfieImage ? (
                                    <img src={selfieImage} className="w-full h-full object-cover p-4 rounded-full aspect-square" alt="Selfie" />
                                ) : (
                                    <div className="text-center p-6">
                                        <div className="w-24 h-24 bg-background-tertiary rounded-full flex items-center justify-center mx-auto mb-4 text-brand-yellow border-4 border-background-primary">
                                            <User className="w-12 h-12" />
                                        </div>
                                        <p className="font-bold text-text-primary mb-1">Tap to Capture</p>
                                    </div>
                                )}
                             </div>
                        </div>
                    )}

                    {step === 'review' && (
                        <div className="animate-fadeIn space-y-6">
                            <h1 className="text-2xl font-bold text-text-primary mb-2">Review & Submit</h1>
                            
                            {/* Personal Info Review */}
                            <div className="bg-background-secondary p-4 rounded-xl border border-border-divider">
                                <h3 className="text-xs font-bold text-text-secondary uppercase mb-3 flex justify-between items-center">
                                    Personal Details
                                    <button onClick={() => setStep('personal_details')} className="text-brand-yellow hover:underline">Edit</button>
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between border-b border-border-divider/30 pb-2">
                                        <span className="text-sm text-text-secondary">Name</span>
                                        <span className="font-medium text-text-primary">{details.fullName}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-border-divider/30 pb-2">
                                        <span className="text-sm text-text-secondary">Doc Number</span>
                                        <span className="font-mono text-text-primary">{details.docNumber}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-text-secondary">Date of Birth</span>
                                        <span className="font-medium text-text-primary">{details.dob}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Documents Review */}
                            <div className="space-y-4">
                                <div className="bg-background-secondary p-4 rounded-xl border border-border-divider flex items-center gap-4">
                                    <img src={frontImage || ''} className="w-16 h-10 object-cover rounded bg-black" alt="Front" />
                                    <div>
                                        <p className="font-bold text-sm text-text-primary">Front Side</p>
                                        <button onClick={() => setStep('upload_front')} className="text-xs font-bold text-brand-yellow hover:underline">Edit</button>
                                    </div>
                                </div>
                                
                                {docType === 'id_card' && (
                                    <div className="bg-background-secondary p-4 rounded-xl border border-border-divider flex items-center gap-4">
                                        <img src={backImage || ''} className="w-16 h-10 object-cover rounded bg-black" alt="Back" />
                                        <div>
                                            <p className="font-bold text-sm text-text-primary">Back Side</p>
                                            <button onClick={() => setStep('upload_back')} className="text-xs font-bold text-brand-yellow hover:underline">Edit</button>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-background-secondary p-4 rounded-xl border border-border-divider flex items-center gap-4">
                                    <img src={selfieImage || ''} className="w-12 h-12 object-cover rounded-full bg-black border-2 border-background-tertiary" alt="Selfie" />
                                    <div>
                                        <p className="font-bold text-sm text-text-primary">Selfie</p>
                                        <button onClick={() => setStep('selfie')} className="text-xs font-bold text-brand-yellow hover:underline">Retake</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Navigation */}
                {step !== 'select_document' && (
                    <div className="mt-6 pt-4 border-t border-border-divider flex gap-3">
                        <button 
                            onClick={handleBack}
                            className="flex-1 py-3.5 rounded-xl font-bold text-text-secondary bg-background-tertiary hover:bg-border-divider transition-colors text-sm"
                        >
                            {t('back')}
                        </button>
                        
                        {step === 'review' ? (
                            <button 
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex-[2] py-3.5 rounded-xl font-bold text-background-primary bg-brand-yellow shadow-lg hover:brightness-110 active:scale-[0.98] transition-all text-sm disabled:opacity-50"
                            >
                                {isSubmitting ? t('loading') : t('submit')}
                            </button>
                        ) : (
                            <button 
                                onClick={handleNext}
                                disabled={
                                    (step === 'personal_details' && !isDetailsValid) ||
                                    (step === 'upload_front' && !frontImage) ||
                                    (step === 'upload_back' && !backImage) ||
                                    (step === 'selfie' && !selfieImage)
                                }
                                className="flex-[2] py-3.5 rounded-xl font-bold text-background-primary bg-brand-yellow shadow-lg hover:brightness-110 active:scale-[0.98] transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t('next')}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </PageLayout>
    );
};

export default KYCScreen;
