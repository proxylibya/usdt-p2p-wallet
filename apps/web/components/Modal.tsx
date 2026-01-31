
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Small delay to allow DOM render before animating in
      requestAnimationFrame(() => setIsAnimating(true));
      document.body.style.overflow = 'hidden'; // Lock body scroll
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
        document.body.style.overflow = ''; // Unlock body scroll
      }, 350); // Match transition duration (slightly longer for smoothness)
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  return createPortal(
    <div 
      className={`fixed inset-0 z-[100] flex justify-center items-end sm:items-center`}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop with Smooth Fade */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Bottom Sheet Container with Spring-like Slide Up */}
      <div
        className={`
            relative w-full max-w-md bg-background-secondary 
            rounded-t-[32px] sm:rounded-3xl 
            flex flex-col max-h-[85vh] 
            shadow-[0_-10px_40px_rgba(0,0,0,0.6)] border-t border-white/10
            transition-all duration-300 cubic-bezier(0.2, 0.9, 0.3, 1)
            ${isAnimating ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-full opacity-0 scale-95'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle (Mobile Visual Cue) */}
        <div className="w-full flex justify-center pt-3 pb-2 cursor-pointer" onClick={onClose}>
            <div className="w-12 h-1.5 rounded-full bg-border-divider/60 hover:bg-border-divider transition-colors"></div>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-3 border-b border-border-divider/30 flex-shrink-0">
            <h2 className="text-lg font-bold text-text-primary tracking-wide">{title}</h2>
            <button 
                onClick={onClose} 
                className="p-2 -mr-2 text-text-secondary hover:text-text-primary hover:bg-background-tertiary rounded-full transition-colors"
            >
                <X className="w-6 h-6" />
            </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 overscroll-contain pb-safe-bottom">
            {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
