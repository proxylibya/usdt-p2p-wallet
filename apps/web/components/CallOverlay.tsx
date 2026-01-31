
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, User, Maximize2, Minimize2, X, MoveDiagonal } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useCall } from '../context/CallContext';
import { useNavigate } from 'react-router-dom';

export const CallOverlay: React.FC = () => {
    const { primaryColor } = useTheme();
    const { callState, endCall, toggleMinimize, setMinimized } = useCall();
    
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(callState.type === 'video');
    const [duration, setDuration] = useState(0);
    const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'reconnecting'>('connecting');
    
    const localVideoRef = useRef<HTMLVideoElement>(null);

    // Sync local video state with global type change
    useEffect(() => {
        setIsVideoEnabled(callState.type === 'video');
    }, [callState.type]);

    // Timer Logic
    useEffect(() => {
        let interval: any;
        if (callState.isActive) {
            // Calculate duration based on start time to keep it synced even if component re-renders
            const updateTimer = () => {
                const now = Date.now();
                const diff = Math.floor((now - callState.startTime) / 1000);
                setDuration(diff);
            };
            updateTimer();
            interval = setInterval(updateTimer, 1000);
        } else {
            setDuration(0);
            setConnectionState('connecting');
        }
        return () => clearInterval(interval);
    }, [callState.isActive, callState.startTime]);

    // Mock Connection Logic
    useEffect(() => {
        if (!callState.isActive) return;

        const connectTimer = setTimeout(() => {
            setConnectionState('connected');
        }, 1500);

        return () => clearTimeout(connectTimer);
    }, [callState.isActive]);

    // Camera Logic with robust mobile handling
    useEffect(() => {
        if (!callState.isActive) return;

        const startLocalStream = async () => {
            if (isVideoEnabled) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
                    
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = stream;
                        localVideoRef.current.muted = true; // Ensure no feedback loop
                        
                        // Explicit play attempt for iOS/Mobile Safari
                        const playPromise = localVideoRef.current.play();
                        if (playPromise !== undefined) {
                            playPromise.catch(error => {
                                console.warn("Auto-play prevented", error);
                            });
                        }
                    }
                } catch (e) {
                    console.warn("Camera/Mic access denied or unavailable", e);
                }
            } else {
                // If switching to audio only, stop video tracks
                if (localVideoRef.current && localVideoRef.current.srcObject) {
                    const tracks = (localVideoRef.current.srcObject as MediaStream).getVideoTracks();
                    tracks.forEach(track => track.stop());
                }
            }
        };

        startLocalStream();

        return () => {
            if (localVideoRef.current && localVideoRef.current.srcObject) {
                const tracks = (localVideoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach(track => track.stop());
            }
        };
    }, [callState.isActive, isVideoEnabled]);

    if (!callState.isActive) return null;

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleExpand = () => {
        setMinimized(false);
    };

    // --- MINI PLAYER MODE ---
    if (callState.isMinimized) {
        return (
            <div className="fixed bottom-[90px] end-4 z-[100] animate-slideInFromRight">
                <div 
                    className="w-32 bg-background-secondary rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-border-divider/50 overflow-hidden relative group backdrop-blur-md"
                >
                    {/* Content Area */}
                    <div className="h-40 bg-black relative cursor-pointer" onClick={handleExpand}>
                        {isVideoEnabled ? (
                            <video 
                                ref={localVideoRef} 
                                autoPlay 
                                muted 
                                playsInline 
                                className="w-full h-full object-cover transform scale-x-[-1]" 
                            />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background-tertiary">
                                {callState.remoteAvatar ? (
                                    <img src={callState.remoteAvatar} className="w-12 h-12 rounded-full object-cover mb-2 ring-2 ring-border-divider" alt="Remote User" />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-background-secondary flex items-center justify-center mb-2 border border-border-divider">
                                        <User className="w-6 h-6 text-text-secondary" />
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Overlay Info */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-3">
                            <span className="text-white text-xs font-bold truncate shadow-sm">{callState.remoteName}</span>
                            <span className="text-success text-[10px] font-mono font-medium shadow-sm">{formatTime(duration)}</span>
                        </div>

                        {/* Expand Icon Overlay */}
                        <div className="absolute top-2 end-2 p-1.5 bg-black/40 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            <Maximize2 className="w-3.5 h-3.5 text-white" />
                        </div>
                    </div>

                    {/* Mini Controls */}
                    <div className="flex items-center justify-between px-4 py-3 bg-background-secondary border-t border-border-divider">
                        <button onClick={() => setIsMuted(!isMuted)} className="text-text-secondary hover:text-text-primary transition-colors">
                            {isMuted ? <MicOff className="w-4 h-4 text-error" /> : <Mic className="w-4 h-4" />}
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); endCall(); }} 
                            className="w-8 h-8 rounded-full bg-error flex items-center justify-center text-white hover:brightness-110 shadow-md transition-transform active:scale-95"
                        >
                            <PhoneOff className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- FULL SCREEN MODE ---
    return (
        <div className="fixed inset-0 z-[100] bg-[#0f1115] flex flex-col animate-fadeIn">
            {/* Main Video Area (Remote) */}
            <div className="flex-grow relative overflow-hidden flex items-center justify-center">
                {/* Simulated Remote Video (Placeholder) */}
                <div className="absolute inset-0 bg-background-tertiary flex flex-col items-center justify-center">
                    {connectionState === 'connecting' ? (
                        <div className="flex flex-col items-center animate-pulse">
                            <div className="w-28 h-28 rounded-full bg-background-secondary flex items-center justify-center mb-6 ring-4 ring-background-primary shadow-xl">
                                {callState.remoteAvatar ? (
                                    <img src={callState.remoteAvatar} className="w-full h-full rounded-full object-cover opacity-50" alt="Remote User" />
                                ) : (
                                    <User className="w-12 h-12 text-text-secondary" />
                                )}
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">{callState.remoteName}</h3>
                            <p className="text-sm text-text-secondary">Connecting...</p>
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="w-32 h-32 rounded-full bg-background-secondary mx-auto mb-6 flex items-center justify-center overflow-hidden ring-4 ring-background-primary shadow-2xl relative">
                                {callState.remoteAvatar ? (
                                    <img src={callState.remoteAvatar} className="w-full h-full object-cover" alt="Remote User" />
                                ) : (
                                    <User className="w-16 h-16 text-text-secondary" />
                                )}
                                {/* Audio Wave Animation if audio only */}
                                {!isVideoEnabled && (
                                    <div className="absolute inset-0 bg-success/20 animate-pulse rounded-full"></div>
                                )}
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">{callState.remoteName}</h3>
                            <p className="text-success font-mono bg-success/10 px-3 py-1 rounded-full inline-block text-sm border border-success/20">
                                {formatTime(duration)}
                            </p>
                        </div>
                    )}
                </div>

                {/* Header Controls */}
                <div className="absolute top-0 inset-x-0 p-6 pt-safe flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent">
                    <button 
                        onClick={toggleMinimize} 
                        className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all active:scale-95"
                    >
                        <Minimize2 className="w-6 h-6 text-white" />
                    </button>
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs font-bold text-white shadow-sm">
                            <div className={`w-2 h-2 rounded-full ${connectionState === 'connected' ? 'bg-success' : 'bg-brand-yellow animate-pulse'}`}></div>
                            {connectionState === 'connected' ? 'End-to-End Encrypted' : 'Connecting...'}
                        </div>
                    </div>
                </div>

                {/* Local Video (PiP) */}
                {isVideoEnabled && (
                    <div className="absolute top-24 end-4 w-32 h-48 bg-black rounded-xl overflow-hidden shadow-2xl border border-white/20 draggable">
                        <video 
                            ref={localVideoRef} 
                            autoPlay 
                            muted 
                            playsInline 
                            className="w-full h-full object-cover transform scale-x-[-1]" 
                        />
                    </div>
                )}
            </div>

            {/* Bottom Controls */}
            <div className="pb-safe pt-10 px-8 bg-background-secondary rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.5)] border-t border-border-divider/20 relative">
                <div className="flex justify-between items-center mb-8 max-w-sm mx-auto">
                    <button 
                        onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                        className={`p-4 rounded-full transition-all active:scale-95 ${isVideoEnabled ? 'bg-white text-black hover:bg-gray-200' : 'bg-background-tertiary text-white hover:bg-background-tertiary/80'}`}
                    >
                        {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                    </button>
                    
                    <button 
                        onClick={() => setIsMuted(!isMuted)}
                        className={`p-4 rounded-full transition-all active:scale-95 ${!isMuted ? 'bg-white text-black hover:bg-gray-200' : 'bg-background-tertiary text-white hover:bg-background-tertiary/80'}`}
                    >
                        {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>

                    <button className="p-4 rounded-full bg-background-tertiary text-white hover:bg-background-tertiary/80 transition-all active:scale-95">
                        <MoveDiagonal className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="flex justify-center mb-8">
                    <button 
                        onClick={endCall}
                        className="w-20 h-20 rounded-full bg-error flex items-center justify-center shadow-lg shadow-error/30 hover:scale-105 active:scale-95 transition-transform ring-4 ring-error/20"
                    >
                        <PhoneOff className="w-8 h-8 text-white fill-current" />
                    </button>
                </div>
            </div>
        </div>
    );
};
