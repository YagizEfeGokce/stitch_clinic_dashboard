import { useState } from 'react';

/**
 * Responsive table that converts to cards on mobile
 * 
 * @param {Array} columns - Column definitions
 * @param {Array} data - Data rows
 * @param {Function} onRowClick - Optional click handler
 * @param {Function} renderActions - Optional actions renderer
 * @param {String} emptyMessage - Message when no data
 * @param {Boolean} loading - Loading state
 * @param {String} keyField - Field to use as key (default: 'id')
 */
export function ResponsiveTable({
    columns = [],
    data = [],
    onRowClick,
    renderActions,
    emptyMessage = 'Veri bulunamadı',
    loading = false,
    keyField = 'id',
}) {
    // Loading state
    if (loading) {
        return (
            <>
                {/* Desktop Loading */}
                <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex gap-4">
                                {columns.map((col, j) => (
                                    <div key={j} className="flex-1">
                                        <div className="h-5 bg-slate-200 rounded animate-pulse" />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mobile Loading */}
                <div className="md:hidden space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                            <div className="space-y-3">
                                {columns.slice(0, 4).map((_, j) => (
                                    <div key={j} className="flex justify-between gap-4">
                                        <div className="h-4 bg-slate-200 rounded w-24 animate-pulse" />
                                        <div className="h-4 bg-slate-200 rounded w-32 animate-pulse" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </>
        );
    }

    // Empty state
    if (!loading && data.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
                <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">
                    inbox
                </span>
                <p className="text-slate-500 text-lg font-medium">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <>
            {/* Desktop: Traditional Table */}
            <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                {columns.map((column) => (
                                    <th
                                        key={column.key}
                                        className={`px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider ${column.headerClassName || ''}`}
                                    >
                                        {column.label}
                                    </th>
                                ))}
                                {renderActions && (
                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        İşlemler
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.map((row) => (
                                <tr
                                    key={row[keyField]}
                                    onClick={() => onRowClick?.(row)}
                                    className={`hover:bg-slate-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                                >
                                    {columns.map((column) => (
                                        <td
                                            key={column.key}
                                            className={`px-6 py-4 text-sm text-slate-900 ${column.cellClassName || ''}`}
                                        >
                                            {column.render
                                                ? column.render(row[column.key], row)
                                                : row[column.key]}
                                        </td>
                                    ))}
                                    {renderActions && (
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {renderActions(row)}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile: Card Layout */}
            <div className="md:hidden space-y-3">
                {data.map((row) => (
                    <div
                        key={row[keyField]}
                        onClick={() => onRowClick?.(row)}
                        className={`bg-white rounded-2xl border border-slate-100 p-4 shadow-sm ${onRowClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''}`}
                    >
                        {/* Card Content */}
                        <div className="space-y-3">
                            {columns.map((column) => {
                                // Skip hidden columns on mobile
                                if (column.hideOnMobile) return null;

                                const value = column.render
                                    ? column.render(row[column.key], row)
                                    : row[column.key];

                                // First column is primary (rendered differently)
                                if (column.primary) {
                                    return (
                                        <div key={column.key} className="pb-2 mb-2 border-b border-slate-100">
                                            {value}
                                        </div>
                                    );
                                }

                                return (
                                    <div
                                        key={column.key}
                                        className="flex justify-between items-center gap-4"
                                    >
                                        <span className="text-sm font-medium text-slate-500">
                                            {column.label}
                                        </span>
                                        <span className="text-sm text-slate-900 text-right">
                                            {value || '-'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Card Actions */}
                        {renderActions && (
                            <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2 justify-end">
                                {renderActions(row)}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </>
    );
}

/**
 * Helper function to create column definitions
 */
export function createColumn({
    key,
    label,
    render,
    hideOnMobile = false,
    primary = false,
    headerClassName = '',
    cellClassName = '',
}) {
    return {
        key,
        label,
        render,
        hideOnMobile,
        primary,
        headerClassName,
        cellClassName,
    };
}

/**
 * Toolbar for tables with search and actions
 */
export function TableToolbar({
    searchPlaceholder = 'Ara...',
    onSearch,
    searchValue = '',
    actions,
    resultCount,
}) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-4 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                {/* Search */}
                <div className="relative flex-1 w-full sm:max-w-md">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                        search
                    </span>
                    <input
                        type="text"
                        value={searchValue}
                        onChange={(e) => onSearch?.(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                    />
                </div>

                <div className="flex items-center gap-4">
                    {/* Result Count */}
                    {resultCount !== undefined && (
                        <p className="text-sm text-slate-500 font-medium">
                            {resultCount} sonuç
                        </p>
                    )}

                    {/* Actions */}
                    {actions && (
                        <div className="flex gap-2">
                            {actions}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
