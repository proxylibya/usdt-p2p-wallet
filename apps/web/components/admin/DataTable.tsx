
import React, { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export interface TableColumn<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  sortable?: boolean;
  sortKey?: keyof T; // Required if accessor is a function and sorting is needed
}

interface DataTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  filters?: React.ReactNode;
}

export const DataTable = <T extends { id: string }>({ columns, data, searchPlaceholder, searchKeys, filters }: DataTableProps<T>) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: 'asc' | 'desc' } | null>(null);
    const { t } = useLanguage();
    const itemsPerPage = 7;

    // Filtering Logic
    const filteredData = useMemo(() => {
        let result = data;

        if (searchTerm) {
            const lowercasedFilter = searchTerm.toLowerCase();
            result = result.filter(item => {
                if (searchKeys && searchKeys.length > 0) {
                    return searchKeys.some(key =>
                        String(item[key]).toLowerCase().includes(lowercasedFilter)
                    );
                } else {
                    return Object.values(item).some(val =>
                        String(val).toLowerCase().includes(lowercasedFilter)
                    );
                }
            });
        }
        return result;
    }, [data, searchTerm, searchKeys]);

    // Sorting Logic
    const sortedData = useMemo(() => {
        if (!sortConfig) return filteredData;

        return [...filteredData].sort((a, b) => {
            const key = sortConfig.key;
            const aValue = a[key];
            const bValue = b[key];

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                 return sortConfig.direction === 'asc' 
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }
            
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredData, sortConfig]);

    // Pagination Logic
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedData.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedData, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(sortedData.length / itemsPerPage);

    const handleSort = (column: TableColumn<T>) => {
        if (!column.sortable) return;
        
        const key = (typeof column.accessor === 'function' ? column.sortKey : column.accessor) as keyof T;
        
        if (!key) return;

        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    return (
        <div className="bg-background-secondary rounded-lg overflow-hidden">
            <div className="p-4 flex justify-between items-center border-b border-border-divider">
                <div className="relative w-full max-w-xs">
                     <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                    <input
                        type="text"
                        placeholder={searchPlaceholder || t('search_placeholder')}
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full bg-background-tertiary border border-border-divider rounded-lg p-2 ps-10 focus:outline-none"
                    />
                </div>
                <div>{filters}</div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-start text-text-secondary">
                    <thead className="text-xs text-text-secondary uppercase bg-background-tertiary">
                        <tr>
                            {columns.map((col, index) => (
                                <th 
                                    key={index} 
                                    scope="col" 
                                    className={`px-6 py-3 ${col.sortable ? 'cursor-pointer hover:text-text-primary transition-colors select-none' : ''}`}
                                    onClick={() => handleSort(col)}
                                >
                                    <div className="flex items-center gap-1.5">
                                        {col.header}
                                        {col.sortable && (
                                            <div className="flex flex-col">
                                                {sortConfig && sortConfig.key === (typeof col.accessor === 'function' ? col.sortKey : col.accessor) ? (
                                                    sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-brand-yellow" /> : <ChevronDown className="w-3 h-3 text-brand-yellow" />
                                                ) : (
                                                    <div className="opacity-30 flex flex-col -space-y-1">
                                                        <ChevronUp className="w-2 h-2" />
                                                        <ChevronDown className="w-2 h-2" />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((item) => (
                            <tr key={item.id} className="border-b border-border-divider hover:bg-background-tertiary">
                                {columns.map((col, index) => (
                                    <td key={index} className="px-6 py-4">
                                        {typeof col.accessor === 'function'
                                            ? col.accessor(item)
                                            : <span className="text-text-primary font-medium">{String(item[col.accessor as keyof T])}</span>
                                        }
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
             <div className="p-4 flex justify-between items-center text-sm">
                <span className="text-text-secondary">
                    {t('page')} {currentPage} {t('of')} {totalPages}
                </span>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 bg-background-tertiary rounded disabled:opacity-50"
                    >
                        {t('previous')}
                    </button>
                     <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 bg-background-tertiary rounded disabled:opacity-50"
                    >
                        {t('next')}
                    </button>
                </div>
            </div>
        </div>
    );
};
