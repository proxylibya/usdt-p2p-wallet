
import React, { useState } from 'react';
import { Modal } from './Modal';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Star, ThumbsUp, ThumbsDown } from 'lucide-react';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    counterpartyName: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, counterpartyName }) => {
    const { t } = useLanguage();
    const { primaryColor } = useTheme();
    const [rating, setRating] = useState<'positive' | 'negative' | null>(null);
    const [comment, setComment] = useState('');

    const handleSubmit = () => {
        // Logic to submit feedback would go here
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Rate Trade">
            <div className="space-y-6 text-center">
                <div className="bg-background-tertiary p-6 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                    <Star className={`w-10 h-10 text-${primaryColor} fill-current`} />
                </div>
                
                <div>
                    <h3 className="text-lg font-bold text-text-primary">How was your trade?</h3>
                    <p className="text-text-secondary text-sm mt-1">Rate your experience with {counterpartyName}</p>
                </div>

                <div className="flex justify-center gap-4">
                    <button 
                        onClick={() => setRating('positive')}
                        className={`flex flex-col items-center justify-center w-24 h-24 rounded-xl border-2 transition-all ${rating === 'positive' ? 'border-success bg-success/10 text-success' : 'border-border-divider bg-background-secondary text-text-secondary hover:border-success/50'}`}
                    >
                        <ThumbsUp className="w-8 h-8 mb-2" />
                        <span className="text-sm font-bold">Positive</span>
                    </button>
                    <button 
                        onClick={() => setRating('negative')}
                        className={`flex flex-col items-center justify-center w-24 h-24 rounded-xl border-2 transition-all ${rating === 'negative' ? 'border-error bg-error/10 text-error' : 'border-border-divider bg-background-secondary text-text-secondary hover:border-error/50'}`}
                    >
                        <ThumbsDown className="w-8 h-8 mb-2" />
                        <span className="text-sm font-bold">Negative</span>
                    </button>
                </div>

                <textarea 
                    placeholder="Leave a comment (optional)" 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full bg-background-tertiary border border-border-divider rounded-lg p-3 focus:outline-none min-h-[80px]"
                />

                <button 
                    onClick={handleSubmit} 
                    disabled={!rating}
                    className={`w-full p-4 rounded-xl font-bold text-background-primary transition-opacity disabled:opacity-50 bg-${primaryColor}`}
                >
                    Submit Feedback
                </button>
            </div>
        </Modal>
    );
};
