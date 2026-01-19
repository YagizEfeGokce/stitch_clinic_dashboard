import { Skeleton, SkeletonAvatar } from '../Skeleton';

/**
 * Generic list item skeleton
 */
export function ListItemSkeleton() {
    return (
        <div className="flex items-center gap-4 p-4 border-b border-slate-100 last:border-0">
            <SkeletonAvatar size="sm" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="w-20 h-8 rounded-lg" />
        </div>
    );
}

/**
 * Full list skeleton
 * @param {number} items - Number of items to show
 */
export function ListSkeleton({ items = 6 }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100">
            {Array.from({ length: items }).map((_, i) => (
                <ListItemSkeleton key={i} />
            ))}
        </div>
    );
}

/**
 * Table skeleton for data tables
 * @param {number} rows - Number of rows
 * @param {number} columns - Number of columns
 */
export function TableSkeleton({ rows = 5, columns = 4 }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Table Header */}
            <div className="border-b border-slate-100 bg-slate-50 px-6 py-3">
                <div className="flex gap-4">
                    {Array.from({ length: columns }).map((_, i) => (
                        <Skeleton key={i} className="h-5 w-24 flex-1" />
                    ))}
                </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-slate-100">
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <div key={rowIndex} className="px-6 py-4">
                        <div className="flex gap-4">
                            {Array.from({ length: columns }).map((_, colIndex) => (
                                <Skeleton key={colIndex} className="h-5 flex-1" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
