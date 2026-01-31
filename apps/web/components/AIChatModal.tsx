
import React, { useState, useRef, useEffect } from 'react';
import { AIService } from '../services/aiService';
import { Send, Volume2, StopCircle, Mic, MicOff, Bot, User, X } from 'lucide-react'; 
import { useTheme } from '../context/ThemeContext';
import { SparklesIcon } from './icons/SparklesIcon';
import { useLocation } from 'react-router-dom';
import { useLiveData } from '../context/LiveDataContext';
import { useAuth } from '../context/AuthContext';
import { getAudioContext } from '../hooks/useSound';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  isTyping?: boolean; 
}

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

const AIChatModal: React.FC<AIChatModalProps> = ({ isOpen, onClose, initialQuery }) => {
    const { theme } = useTheme();
    const location = useLocation();
    const { wallets, marketCoins } = useLiveData();
    const { user } = useAuth();

    const [messages, setMessages] = useState<Message[]>([
        { id: 1, text: "Hello! I can analyze your portfolio or check market prices for you. What's on your mind?", sender: 'ai' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [playingMessageId, setPlayingMessageId] = useState<number | null>(null);
    const [isListening, setIsListening] = useState(false);
    
    const chatEndRef = useRef<HTMLDivElement>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const typingIntervalRef = useRef<any>(null);
    const recognitionRef = useRef<any>(null);
    const hasFiredInitial = useRef(false);
    
    const primaryColor = theme === 'gold' ? 'brand-yellow' : 'brand-green';

    // Handle Open/Close Logic
    useEffect(() => {
        if(isOpen) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            
            // Ensure audio context is ready
            const ctx = getAudioContext();
            if (ctx.state === 'suspended') {
                ctx.resume().catch(() => {});
            }

            if (initialQuery && !hasFiredInitial.current) {
                handleSend(null, initialQuery);
                hasFiredInitial.current = true;
            }
        } else {
            hasFiredInitial.current = false;
            stopAudio();
            stopListening();
            if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
        }
    }, [isOpen, initialQuery]);
    
    // Auto-scroll logic
    useEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => {
                chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            });
        }
    }, [messages, isOpen]);

    // Body scroll lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen]);

    // Ensure Audio Context is ready (must be called from user gesture)
    const ensureAudioContext = async () => {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }
        return ctx;
    };

    const stopAudio = () => {
        if (audioSourceRef.current) {
            try {
                audioSourceRef.current.stop();
            } catch (e) {
                // Ignore errors if already stopped
            }
            audioSourceRef.current = null;
        }
        setPlayingMessageId(null);
    };

    // --- Speech Recognition ---
    const toggleListening = async () => {
        // Ensure audio context is unlocked even if we are just recording (good practice for subsequent playback)
        await ensureAudioContext();

        if (isListening) stopListening();
        else startListening();
    };

    const startListening = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert("Voice input is not supported in this browser.");
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US'; 

        recognitionRef.current.onstart = () => setIsListening(true);
        recognitionRef.current.onend = () => setIsListening(false);
        recognitionRef.current.onerror = () => {
            setIsListening(false);
        };

        recognitionRef.current.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
            setTimeout(() => handleSend(null, transcript), 600);
        };

        recognitionRef.current.start();
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    // --- Audio Decoding & Playing ---
    const decodeAudioData = async (base64String: string, ctx: AudioContext) => {
        const binaryString = atob(base64String);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        const dataInt16 = new Int16Array(bytes.buffer);
        const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < dataInt16.length; i++) {
             channelData[i] = dataInt16[i] / 32768.0;
        }
        return buffer;
    };

    const handlePlayTTS = async (text: string, messageId: number) => {
        if (playingMessageId === messageId) {
            stopAudio();
            return;
        }

        stopAudio();
        setPlayingMessageId(messageId);

        try {
            // CRITICAL: Resume context immediately on user click to satisfy iOS autoplay policy
            const ctx = await ensureAudioContext();

            const base64Audio = await AIService.generateSpeech(text);
            
            if (base64Audio) {
                // Async safety check
                setPlayingMessageId(prev => {
                    if (prev !== messageId) return prev; // User clicked another button?
                    
                    decodeAudioData(base64Audio, ctx).then(audioBuffer => {
                        // Double check if context is still valid for this message
                        if (audioSourceRef.current) return; 

                        const source = ctx.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(ctx.destination);
                        
                        source.onended = () => {
                            setPlayingMessageId(null);
                            audioSourceRef.current = null;
                        };

                        audioSourceRef.current = source;
                        source.start();
                    });
                    return messageId;
                });
            } else {
                setPlayingMessageId(null);
            }

        } catch {
            setPlayingMessageId(null);
        }
    };

    // --- Typing Effect ---
    const streamText = (text: string, messageId: number) => {
        let i = 0;
        const speed = 15; // ms per char
        
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);

        typingIntervalRef.current = setInterval(() => {
            setMessages(prev => {
                const newMessages = [...prev];
                const msgIndex = newMessages.findIndex(m => m.id === messageId);
                
                if (msgIndex !== -1) {
                    if (i >= text.length) {
                        clearInterval(typingIntervalRef.current);
                        newMessages[msgIndex] = { ...newMessages[msgIndex], text: text, isTyping: false };
                    } else {
                        // Append chunk
                        const nextChunk = text.substring(0, i + 3); // Grab a few chars at a time for smoothness
                        i += 3; 
                        newMessages[msgIndex] = { ...newMessages[msgIndex], text: nextChunk, isTyping: true };
                    }
                }
                return newMessages;
            });
        }, speed);
    };

    const handleSend = async (e: React.FormEvent | null, overrideInput?: string) => {
        e?.preventDefault();
        const textToSend = overrideInput || input;
        
        if (!textToSend.trim() || isLoading) return;

        const userMessage: Message = { id: Date.now(), text: textToSend, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // --- Context Building ---
            const portfolioData = wallets
                .filter(w => w.balance > 0)
                .map(w => `${w.symbol}: ${w.balance.toFixed(4)} (~$${w.usdValue.toFixed(2)})`)
                .join(', ') || 'No active holdings';
            
            const totalValue = wallets.reduce((acc, curr) => acc + curr.usdValue, 0).toFixed(2);

            const marketSummary = marketCoins
                .slice(0, 5)
                .map(c => `${c.symbol}: $${c.price.toFixed(2)} (${c.change24h > 0 ? '+' : ''}${c.change24h.toFixed(2)}%)`)
                .join('\n');
            
            const userName = user ? user.name : 'Guest';

            const contextPrompt = `
                You are a smart financial assistant for 'USDT Wallet'.
                USER: ${userName}. Portfolio: $${totalValue}. Holdings: ${portfolioData}.
                SCREEN: "${location.pathname}".
                MARKET:
                ${marketSummary}
                
                QUERY: ${textToSend}
                
                INSTRUCTIONS:
                - Keep it short (max 2 sentences) unless asked for details.
                - Use the provided context.
                - You can guide to features like /swap, /p2p, /wallet.
            `;

            const text = await AIService.generateText('gemini-2.5-flash', contextPrompt);
            const fullResponseText = AIService.cleanText(text || "I couldn't generate a response.");
            
            const aiMessageId = Date.now() + 1;
            setMessages(prev => [...prev, { id: aiMessageId, text: '', sender: 'ai', isTyping: true }]);
            
            setIsLoading(false);
            streamText(fullResponseText, aiMessageId);

        } catch {
            setMessages(prev => [...prev, { id: Date.now() + 1, text: "Connection error. Please try again.", sender: 'ai' }]);
            setIsLoading(false);
        }
    };

    return (
        <div 
            className={`fixed inset-0 bg-black/60 z-50 flex items-end transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            onClick={onClose}
        >
            <div
                className={`bg-background-secondary w-full max-w-md mx-auto h-[85vh] rounded-t-2xl flex flex-col transition-transform duration-300 ease-out shadow-2xl border-t border-border-divider ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <header className="flex items-center justify-between p-4 border-b border-border-divider flex-shrink-0 bg-background-secondary rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-${primaryColor}/10`}>
                            <SparklesIcon className={`w-5 h-5 text-${primaryColor}`} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-text-primary">AI Assistant</h2>
                            <p className="text-xs text-text-secondary flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span> Online
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-background-tertiary text-text-secondary transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </header>

                {/* Messages */}
                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                             {msg.sender === 'ai' && (
                                 <div className="w-8 h-8 rounded-full bg-background-tertiary flex items-center justify-center flex-shrink-0 border border-border-divider">
                                     <Bot className={`w-5 h-5 text-${primaryColor}`} />
                                 </div>
                             )}
                             
                             <div className={`max-w-[80%] p-3.5 rounded-2xl relative shadow-sm ${
                                msg.sender === 'user' 
                                ? `bg-${primaryColor} text-background-primary rounded-br-sm` 
                                : 'bg-background-tertiary text-text-primary rounded-bl-sm border border-border-divider'
                            }`}>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                    {msg.text}
                                    {msg.isTyping && <span className="inline-block w-1.5 h-4 bg-current ml-1 animate-pulse align-middle opacity-50"></span>}
                                </p>
                                
                                {msg.sender === 'ai' && !msg.isTyping && msg.text.length > 0 && (
                                    <button 
                                        onClick={() => handlePlayTTS(msg.text, msg.id)}
                                        className="absolute -right-9 bottom-0 p-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-background-tertiary transition-colors"
                                    >
                                        {playingMessageId === msg.id ? (
                                            <StopCircle className={`w-5 h-5 fill-current text-${primaryColor} animate-pulse`} />
                                        ) : (
                                            <Volume2 className="w-5 h-5" />
                                        )}
                                    </button>
                                )}
                            </div>
                            
                            {msg.sender === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-background-tertiary flex items-center justify-center flex-shrink-0">
                                    <User className="w-5 h-5 text-text-secondary" />
                                </div>
                            )}
                        </div>
                    ))}
                    
                    {isLoading && (
                         <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-full bg-background-tertiary flex items-center justify-center flex-shrink-0 border border-border-divider">
                                 <Bot className={`w-5 h-5 text-${primaryColor}`} />
                             </div>
                             <div className="bg-background-tertiary p-3 rounded-2xl rounded-bl-sm border border-border-divider">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-text-secondary/50 rounded-full animate-bounce"></span>
                                    <span className="w-2 h-2 bg-text-secondary/50 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                    <span className="w-2 h-2 bg-text-secondary/50 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} className="h-1" />
                </div>

                {/* Input Area */}
                <form onSubmit={(e) => handleSend(e)} className="p-4 border-t border-border-divider bg-background-secondary pb-safe">
                    <div className="flex items-center gap-2 bg-background-tertiary rounded-full p-1.5 border border-border-divider focus-within:border-brand-yellow transition-colors shadow-inner">
                        <button
                            type="button"
                            onClick={toggleListening}
                            className={`p-2.5 rounded-full transition-all flex-shrink-0 ${isListening ? 'bg-error text-white animate-pulse' : 'hover:bg-background-primary text-text-secondary'}`}
                        >
                            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>

                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isListening ? "Listening..." : "Ask me anything..."}
                            className="flex-grow bg-transparent border-none outline-none text-text-primary placeholder-text-secondary/50 px-2 h-10"
                        />
                        
                        <button 
                            type="submit" 
                            disabled={!input.trim() || isLoading} 
                            className={`p-2.5 rounded-full transition-all flex-shrink-0 ${input.trim() ? `bg-${primaryColor} text-background-primary shadow-md hover:brightness-110` : 'bg-background-primary text-text-secondary opacity-50 cursor-not-allowed'}`}
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AIChatModal;
