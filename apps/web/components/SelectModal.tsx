import React, { useMemo, useState } from 'react';
import { Modal } from './Modal';
import { Search, Check } from 'lucide-react';

export type SelectOption<T extends string = string> = {
    value: T;
    label: string;
    description?: string;
    icon?: React.ReactNode;
};

const normalizeText = (text: string) => {
    if (!text) return '';
    return text
        .toLowerCase()
        .replace(/[\u0622\u0623\u0625\u0671\u0672\u0673\u0675]/g, 'ا')
        .replace(/[\u0629]/g, 'ه')
        .replace(/[\u0649]/g, 'ي');
};

interface SelectModalProps<T extends string = string> {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    value: T;
    options: SelectOption<T>[];
    onChange: (value: T) => void;
    searchable?: boolean;
    searchPlaceholder?: string;
    accentColorClassName?: string;
}

export const SelectModal = <T extends string = string>({
    isOpen,
    onClose,
    title,
    value,
    options,
    onChange,
    searchable = false,
    searchPlaceholder,
    accentColorClassName = 'text-brand-yellow',
}: SelectModalProps<T>) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredOptions = useMemo(() => {
        if (!searchable) return options;
        const q = normalizeText(searchTerm);
        if (!q) return options;
        return options.filter(o => {
            const a = normalizeText(o.label);
            const b = normalizeText(o.description || '');
            return a.includes(q) || b.includes(q);
        });
    }, [options, searchTerm, searchable]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="flex flex-col max-h-[50vh] h-auto min-h-[260px]">
                {searchable && (
                    <div className="relative mb-4 flex-shrink-0">
                        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={searchPlaceholder || 'Search...'}
                            className="w-full bg-background-tertiary border border-border-divider rounded-lg p-3 ps-10 focus:outline-none text-text-primary"
                        />
                    </div>
                )}

                <div className="flex-grow overflow-y-auto space-y-1">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => {
                                    onChange(opt.value);
                                    onClose();
                                }}
                                className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-background-tertiary transition-colors ${value === opt.value ? 'bg-background-tertiary' : ''}`}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    {opt.icon ? (
                                        <div className="flex-shrink-0">{opt.icon}</div>
                                    ) : null}

                                    <div className="text-start truncate">
                                        <p className="font-bold text-text-primary truncate">{opt.label}</p>
                                        {opt.description ? (
                                            <p className="text-xs text-text-secondary truncate">{opt.description}</p>
                                        ) : null}
                                    </div>
                                </div>

                                {value === opt.value ? (
                                    <Check className={`w-5 h-5 flex-shrink-0 ${accentColorClassName}`} />
                                ) : null}
                            </button>
                        ))
                    ) : (
                        <div className="text-center py-8 text-text-secondary text-sm">No results</div>
                    )}
                </div>
            </div>
        </Modal>
    );
};
