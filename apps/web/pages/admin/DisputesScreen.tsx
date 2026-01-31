
import React, { useState } from 'react';
import { useP2P } from '../../context/P2PContext';
import { useLanguage } from '../../context/LanguageContext';
import { P2PTrade, TradeStatusP2P } from '../../types';
import { Modal } from '../../components/Modal';
import { ShieldAlert, CheckCircle, XCircle, BrainCircuit, Sparkles } from 'lucide-react';
import { AIService } from '../../services/aiService';

interface AIAnalysisResult {
    recommendation: string;
    confidence: number;
    reasoning: string;
    key_evidence: string;
}

const DisputesScreen: React.FC = () => {
    const { activeTrades, resolveDispute } = useP2P();
    const { t } = useLanguage();
    const [selectedDispute, setSelectedDispute] = useState<P2PTrade | null>(null);
    const [isResolving, setIsResolving] = useState(false);
    
    // AI State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);

    const disputedTrades = activeTrades.filter(t => t.status === TradeStatusP2P.DISPUTED);

    const handleResolve = async (resolution: 'buyer_wins' | 'seller_wins') => {
        if (!selectedDispute) return;
        setIsResolving(true);
        await resolveDispute(selectedDispute.id, resolution);
        setIsResolving(false);
        setSelectedDispute(null);
        setAiResult(null);
    };

    const handleAnalyze = async () => {
        if (!selectedDispute) return;
        setIsAnalyzing(true);
        try {
            const result = await AIService.analyzeDispute(
                selectedDispute.chatHistory, 
                selectedDispute.disputeReason || 'Unknown',
                selectedDispute.buyerName || 'Buyer',
                selectedDispute.sellerName || 'Seller'
            );
            setAiResult(result);
        } catch {
            // AI analysis failed
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleCloseModal = () => {
        setSelectedDispute(null);
        setAiResult(null);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-text-primary">Dispute Resolution</h1>
                <p className="text-text-secondary mt-1">Manage active P2P appeals and conflicts.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {disputedTrades.length > 0 ? (
                    disputedTrades.map(trade => (
                        <div key={trade.id} className="bg-background-secondary p-6 rounded-xl border border-error/30 shadow-lg animate-fadeIn">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-bold text-error bg-error/10 px-2 py-1 rounded">DISPUTE #{trade.id.slice(-4)}</span>
                                        <span className="text-sm text-text-secondary">{new Date(trade.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-text-primary">
                                        {trade.amount} {trade.offer.asset} <span className="text-text-secondary">for</span> {trade.fiatAmount} {trade.offer.fiatCurrency}
                                    </h3>
                                </div>
                                <button 
                                    onClick={() => setSelectedDispute(trade)}
                                    className="px-4 py-2 bg-background-tertiary hover:bg-background-primary text-text-primary rounded-lg font-bold text-sm transition-colors"
                                >
                                    Review Case
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm bg-background-tertiary/30 p-4 rounded-lg">
                                <div>
                                    <span className="block text-xs text-text-secondary uppercase font-bold mb-1">Buyer</span>
                                    <p className="font-medium text-text-primary">{trade.buyerName || 'Unknown'}</p>
                                </div>
                                <div>
                                    <span className="block text-xs text-text-secondary uppercase font-bold mb-1">Seller</span>
                                    <p className="font-medium text-text-primary">{trade.sellerName || 'Unknown'}</p>
                                </div>
                                <div className="col-span-2 border-t border-border-divider pt-3 mt-1">
                                    <span className="block text-xs text-error uppercase font-bold mb-1">Reason</span>
                                    <p className="font-medium text-text-primary">{trade.disputeReason || 'No reason provided'}</p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 bg-background-secondary rounded-xl border border-border-divider border-dashed">
                        <ShieldAlert className="w-16 h-16 text-text-secondary/30 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-text-primary">No Active Disputes</h3>
                        <p className="text-text-secondary">All trades are running smoothly.</p>
                    </div>
                )}
            </div>

            {selectedDispute && (
                <Modal isOpen={!!selectedDispute} onClose={handleCloseModal} title={`Resolve Dispute #${selectedDispute.id.slice(-4)}`}>
                    <div className="space-y-6">
                        
                        {/* AI Analysis Section */}
                        <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 rounded-xl p-4 border border-indigo-500/20">
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-2">
                                    <BrainCircuit className="w-5 h-5 text-indigo-400" />
                                    <span className="font-bold text-text-primary">AI Judge Assistant</span>
                                </div>
                                {!aiResult && (
                                    <button 
                                        onClick={handleAnalyze} 
                                        disabled={isAnalyzing}
                                        className="flex items-center gap-1 text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        <Sparkles className="w-3 h-3" />
                                        {isAnalyzing ? 'Analyzing...' : 'Analyze Evidence'}
                                    </button>
                                )}
                            </div>

                            {aiResult && (
                                <div className="space-y-3 animate-fadeIn">
                                    <div className="flex justify-between items-center bg-background-primary/50 p-2 rounded-lg">
                                        <span className="text-xs text-text-secondary">Recommendation</span>
                                        <span className={`text-sm font-bold ${aiResult.recommendation.includes('Buyer') ? 'text-success' : 'text-error'}`}>
                                            {aiResult.recommendation}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-xs text-text-secondary font-bold">Reasoning:</span>
                                        <p className="text-xs text-text-primary leading-relaxed">{aiResult.reasoning}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-xs text-text-secondary font-bold">Key Evidence:</span>
                                        <p className="text-xs text-text-primary italic border-l-2 border-indigo-500/50 pl-2">"{aiResult.key_evidence}"</p>
                                    </div>
                                    <div className="flex justify-end">
                                        <span className="text-[10px] text-text-secondary">Confidence: {aiResult.confidence}%</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Chat Preview */}
                        <div className="bg-background-tertiary rounded-xl p-4 max-h-60 overflow-y-auto space-y-3">
                            <p className="text-xs text-text-secondary mb-2 uppercase font-bold">Chat History</p>
                            {selectedDispute.chatHistory.map(msg => (
                                <div key={msg.id} className={`flex flex-col ${msg.sender === 'system' ? 'items-center' : (msg.sender === 'me' ? 'items-end' : 'items-start')}`}>
                                    <div className={`max-w-[85%] p-2 rounded-lg text-xs ${msg.sender === 'system' ? 'bg-text-secondary/20 text-text-secondary italic' : 'bg-background-secondary border border-border-divider text-text-primary'}`}>
                                        <span className="font-bold opacity-70 block mb-0.5 uppercase text-[9px]">{msg.sender}</span>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => handleResolve('buyer_wins')}
                                disabled={isResolving}
                                className="p-4 bg-success/10 border border-success/30 rounded-xl hover:bg-success/20 transition-colors text-start group"
                            >
                                <span className="flex items-center gap-2 font-bold text-success mb-1">
                                    <CheckCircle className="w-5 h-5" /> Release to Buyer
                                </span>
                                <p className="text-xs text-text-secondary group-hover:text-text-primary">Crypto released to Buyer.</p>
                            </button>

                            <button 
                                onClick={() => handleResolve('seller_wins')}
                                disabled={isResolving}
                                className="p-4 bg-error/10 border border-error/30 rounded-xl hover:bg-error/20 transition-colors text-start group"
                            >
                                <span className="flex items-center gap-2 font-bold text-error mb-1">
                                    <XCircle className="w-5 h-5" /> Refund Seller
                                </span>
                                <p className="text-xs text-text-secondary group-hover:text-text-primary">Crypto returned to Seller.</p>
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default DisputesScreen;
