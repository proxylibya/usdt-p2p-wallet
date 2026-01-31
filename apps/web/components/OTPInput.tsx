
import React, { useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

interface OTPInputProps {
    length?: number;
    value: string;
    onChange: (value: string) => void;
    onComplete?: (value: string) => void;
}

export const OTPInput: React.FC<OTPInputProps> = ({ length = 6, value, onChange, onComplete }) => {
    const { primaryColor } = useTheme();
    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

    // Initialize inputs array reference
    useEffect(() => {
        inputsRef.current = inputsRef.current.slice(0, length);
    }, [length]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const val = e.target.value;
        
        // Allow any character (numbers or letters) for testing
        const newChar = val.slice(-1); 
        
        const newValueArr = value.split('');
        // Ensure array is correct length padded with empty strings
        while (newValueArr.length < length) newValueArr.push('');
        
        newValueArr[index] = newChar;
        const newValue = newValueArr.join('').slice(0, length);

        onChange(newValue);

        // Auto focus next input
        if (newChar && index < length - 1) {
            inputsRef.current[index + 1]?.focus();
        }
        
        if (newValue.length === length && onComplete) {
            onComplete(newValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace') {
            if (!value[index] && index > 0) {
                // If current is empty and backspace pressed, move previous and delete
                const newValueArr = value.split('');
                newValueArr[index - 1] = '';
                onChange(newValueArr.join(''));
                inputsRef.current[index - 1]?.focus();
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
             inputsRef.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < length - 1) {
             inputsRef.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        // Allow text paste
        const pastedData = e.clipboardData.getData('text').slice(0, length); 
        if (pastedData) {
            onChange(pastedData);
            // Focus the box after the pasted content
            const nextIndex = Math.min(pastedData.length, length - 1);
            inputsRef.current[nextIndex]?.focus();
            if (pastedData.length === length && onComplete) {
                onComplete(pastedData);
            }
        }
    };

    return (
        <div className="flex gap-2 sm:gap-3 justify-center w-full" dir="ltr">
            {Array.from({ length }).map((_, index) => (
                <input
                    key={index}
                    ref={el => { inputsRef.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={value[index] || ''}
                    onChange={(e) => handleChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={handlePaste}
                    className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold bg-background-tertiary border border-border-divider rounded-xl focus:outline-none transition-all duration-200 shadow-sm"
                    style={{
                        // We use inline style for dynamic focus color from theme
                        boxShadow: inputsRef.current[index] === document.activeElement 
                            ? `0 0 0 2px var(--tw-color-${primaryColor})` 
                            : 'none',
                        borderColor: inputsRef.current[index] === document.activeElement 
                            ? `var(--tw-color-${primaryColor})` 
                            : ''
                    }}
                />
            ))}
        </div>
    );
};
