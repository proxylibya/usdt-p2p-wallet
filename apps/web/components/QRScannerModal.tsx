
import React, { useEffect, useRef, useState } from 'react';
import { Modal } from './Modal';
import { Camera, AlertCircle, Zap, Loader2, Image as ImageIcon, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { AIService } from '../services/aiService';

interface QRScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (data: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose, onScan }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [permissionError, setPermissionError] = useState<string>('');
    const [isScanning, setIsScanning] = useState(false);
    const [isProcessingAI, setIsProcessingAI] = useState(false);
    const [useAiMode, setUseAiMode] = useState(false);
    const [feedbackMsg, setFeedbackMsg] = useState('');
    
    const { t } = useLanguage();
    const { primaryColor } = useTheme();

    const isNativeSupported = typeof window !== 'undefined' && 'BarcodeDetector' in window;

    useEffect(() => {
        let stream: MediaStream | null = null;

        const startCamera = async () => {
            if (isOpen) {
                // Reset states
                setFeedbackMsg('');
                setIsProcessingAI(false);
                setHasPermission(null);

                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    setHasPermission(false);
                    setPermissionError("Browser does not support camera access.");
                    return;
                }

                try {
                    try {
                        stream = await navigator.mediaDevices.getUserMedia({ 
                            video: { facingMode: 'environment' } 
                        });
                    } catch (envErr) {
                        stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    }

                    if (videoRef.current && stream) {
                        videoRef.current.srcObject = stream;
                        // iOS Safari requires playsinline
                        videoRef.current.setAttribute('playsinline', 'true');
                        
                        // Explicitly trigger play to satisfy mobile browser autoplay policies
                        const playPromise = videoRef.current.play();
                        if (playPromise !== undefined) {
                            playPromise.catch(error => {
                                console.warn("Auto-play prevented", error);
                            });
                        }

                        setHasPermission(true);
                        setPermissionError('');
                        setIsScanning(true);
                        
                        if (isNativeSupported && !useAiMode) {
                            try {
                                const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
                                const detectLoop = async () => {
                                    if (!videoRef.current || !isScanning || !isOpen) return;
                                    if (videoRef.current.readyState < 2) {
                                        requestAnimationFrame(detectLoop);
                                        return;
                                    }
                                    try {
                                        const barcodes = await barcodeDetector.detect(videoRef.current);
                                        if (barcodes.length > 0) {
                                            const rawValue = barcodes[0].rawValue;
                                            if (rawValue) {
                                                handleSuccess(rawValue);
                                                return;
                                            }
                                        }
                                    } catch (e) {
                                        // Ignore
                                    }
                                    requestAnimationFrame(detectLoop);
                                };
                                detectLoop();
                            } catch (e) {
                                console.warn("BarcodeDetector failed, fallback available via AI button");
                            }
                        }
                    }
                } catch (err: any) {
                    setHasPermission(false);
                    if (err.name === 'NotAllowedError') {
                        setPermissionError("Camera permission denied. Use upload instead.");
                    } else {
                        setPermissionError("Unable to access camera.");
                    }
                }
            } else {
                // Cleanup
                if (videoRef.current && videoRef.current.srcObject) {
                    const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                    tracks.forEach(track => track.stop());
                    videoRef.current.srcObject = null;
                }
                setIsScanning(false);
            }
        };

        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            setIsScanning(false);
        };
    }, [isOpen, useAiMode]);

    const handleSuccess = (result: string) => {
        setIsScanning(false);
        const cleaned = result.trim();
        onScan(cleaned);
        onClose();
    };

    const cleanText = (input: string): string => {
        // Robust cleaning for AI output
        let text = input.replace(/```json/gi, '').replace(/```/g, '').trim();
        // Remove conversational prefixes if present (e.g. "The address is: ...", "Address found:")
        text = text.replace(/^(The address is|Address|Found|Here is the address|Crypto Address):?\s*/i, '');
        // Remove trailing periods often added by LLMs
        text = text.replace(/\.$/, '');
        // Remove quotes if the AI wrapped the result in quotes
        text = text.replace(/^["']|["']$/g, '');
        return text.trim();
    };

    const analyzeImage = async (base64Image: string) => {
        setIsProcessingAI(true);
        setFeedbackMsg('Analyzing with Gemini AI...');
        try {
            const prompt = `
            Task: Extract a cryptocurrency address from this image.
            Instructions:
            1. Identify crypto addresses (0x..., T..., 1..., 3..., bc1..., Base58).
            2. Decode QR codes if visible.
            3. Return ONLY the raw address string.
            4. Do NOT output markdown, JSON, or any conversational text.
            5. If not found, return "NOT_FOUND".
            `;
            
            const text = await AIService.analyzeImage(base64Image, prompt);
            const result = cleanText(text || '');
            
            if (result && result.length > 10 && !result.includes('NOT_FOUND') && !result.includes(' ')) { 
                handleSuccess(result);
            } else {
                setFeedbackMsg("No valid address found.");
                setTimeout(() => {
                    setFeedbackMsg('');
                    setIsProcessingAI(false);
                }, 3000);
            }

        } catch {
            setFeedbackMsg("Analysis failed.");
            setTimeout(() => {
                setFeedbackMsg('');
                setIsProcessingAI(false);
            }, 3000);
        }
    };

    const captureAndAnalyze = async () => {
        if (!videoRef.current || isProcessingAI) return;
        
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const base64Image = canvas.toDataURL('image/jpeg', 0.8);
        await analyzeImage(base64Image);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                setFeedbackMsg("File too large (>5MB)");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                analyzeImage(base64);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Scan QR Code">
            <div className="relative h-[60vh] bg-black rounded-lg overflow-hidden flex flex-col items-center justify-center">
                {hasPermission === false ? (
                    <div className="text-white text-center p-6 flex flex-col items-center justify-center h-full space-y-6">
                        <div className="bg-white/10 p-4 rounded-full">
                            <AlertCircle className="w-12 h-12 text-error" />
                        </div>
                        <div>
                            <p className="font-bold text-lg">Camera Access Issues</p>
                            <p className="text-sm text-gray-400 max-w-xs mt-1">{permissionError}</p>
                        </div>
                        
                        <div className="w-full max-w-xs border-t border-white/10 pt-6">
                            <p className="text-sm text-gray-300 mb-3">Upload a QR code image instead:</p>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full flex items-center justify-center gap-2 bg-background-tertiary px-4 py-3 rounded-xl text-sm font-bold text-white hover:bg-white/10 transition-colors border border-white/20"
                            >
                                <ImageIcon className="w-5 h-5" />
                                Upload from Gallery
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <video ref={videoRef} autoPlay playsInline muted className={`absolute inset-0 w-full h-full object-cover transition-opacity ${isProcessingAI ? 'opacity-30 blur-sm' : 'opacity-100'}`}/>
                        
                        {/* Overlay Guide */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="relative w-64 h-64 border-2 border-white/50 rounded-3xl bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
                                <div className={`absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-${primaryColor} rounded-tl-xl -mt-1 -ml-1`}></div>
                                <div className={`absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-${primaryColor} rounded-tr-xl -mt-1 -mr-1`}></div>
                                <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-${primaryColor} rounded-bl-xl -mb-1 -ml-1`}></div>
                                <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-${primaryColor} rounded-br-xl -mb-1 -mr-1`}></div>
                                
                                {!isProcessingAI && <div className={`absolute left-2 right-2 h-0.5 bg-${primaryColor} shadow-[0_0_10px_rgba(240,185,11,0.8)] animate-[scan_2s_linear_infinite]`}></div>}
                            </div>
                        </div>
                        
                        {/* Status Overlay */}
                        {(isProcessingAI || feedbackMsg) && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-30 animate-fadeIn">
                                {isProcessingAI && <Loader2 className="w-16 h-16 text-white animate-spin mb-4" />}
                                <p className="text-white font-bold text-lg drop-shadow-md bg-black/60 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/10">
                                    {feedbackMsg || "Processing..."}
                                </p>
                            </div>
                        )}

                        {/* Controls */}
                        <div className="absolute bottom-6 z-20 flex flex-col items-center gap-3 pointer-events-auto w-full px-6">
                            <div className="flex gap-3 w-full max-w-sm">
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isProcessingAI}
                                    className="flex-1 flex items-center justify-center gap-2 bg-black/40 backdrop-blur-md text-white px-4 py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-transform border border-white/10"
                                >
                                    <ImageIcon className="w-5 h-5" />
                                    <span>Upload</span>
                                </button>
                                
                                <button 
                                    onClick={captureAndAnalyze} 
                                    disabled={isProcessingAI} 
                                    className={`flex-[2] flex items-center justify-center gap-2 bg-${primaryColor} text-background-primary px-4 py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-transform hover:brightness-110`}
                                >
                                    <Zap className="w-5 h-5 fill-current" />
                                    <span>AI Scan</span>
                                </button>
                            </div>
                        </div>
                    </>
                )}
                
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileUpload}
                />
            </div>
            <style>{`@keyframes scan { 0% { top: 10%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 90%; opacity: 0; } }`}</style>
        </Modal>
    );
};
