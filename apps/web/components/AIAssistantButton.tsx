
import React from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import { useTheme } from '../context/ThemeContext';

interface AIAssistantButtonProps {
    onOpen: () => void;
}

const AIAssistantButton: React.FC<AIAssistantButtonProps> = ({ onOpen }) => {
    const { theme } = useTheme();
    const bgColor = theme === 'gold' ? 'bg-brand-yellow' : 'bg-brand-green';

    return (
        <button
            onClick={onOpen}
            className={`fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transform transition-transform hover:scale-110 active:scale-95 ${bgColor}`}
            aria-label="Open AI Assistant"
        >
            <SparklesIcon className="w-8 h-8 text-background-primary" />
        </button>
    );
};

export default AIAssistantButton;