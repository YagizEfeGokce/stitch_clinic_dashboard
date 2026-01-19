import { Skeleton, SkeletonAvatar } from '../Skeleton';

/**
 * Skeleton for stat cards on dashboard/home
 */
export function StatCardSkeleton() {
    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
            <Skeleton className="w-12 h-12 rounded-full mb-3" />
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-4 w-24" />
        </div>
    );
}

/**
 * Skeleton for client/patient cards in list view
 */
export function ClientCardSkeleton() {
    return (
        <div className="group flex flex-col md:flex-row md:items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 flex-1">
                <SkeletonAvatar size="md" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-40" />
                </div>
            </div>
            <div className="hidden md:flex items-center gap-8">
                <div className="flex flex-col items-end space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex flex-col items-end space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-16" />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Skeleton className="w-9 h-9 rounded-xl" />
                <Skeleton className="w-9 h-9 rounded-xl" />
            </div>
        </div>
    );
}

/**
 * Skeleton for appointment cards
 */
export function AppointmentCardSkeleton() {
    return (
        <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <div className="flex flex-col items-center justify-center min-w-[4rem] bg-slate-100 rounded-lg py-2 px-1">
                <Skeleton className="h-3 w-10 mb-1" />
                <Skeleton className="h-4 w-8" />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-6 w-16 rounded-md" />
        </div>
    );
}

/**
 * Skeleton for product/inventory cards
 */
export function ProductCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-4">
            <div className="flex gap-4">
                <Skeleton className="h-16 w-16 rounded-xl" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-5 w-20 rounded-md" />
                </div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <Skeleton className="h-4 w-24" />
                <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-lg" />
                    <Skeleton className="w-10 h-6" />
                    <Skeleton className="w-8 h-8 rounded-lg" />
                </div>
            </div>
        </div>
    );
}

/**
 * Skeleton for quick action cards
 */
export function QuickActionSkeleton() {
    return (
        <div className="flex items-center gap-3 px-5 py-3 bg-white border border-slate-100 rounded-xl shadow-sm min-w-max">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-16" />
            </div>
        </div>
    );
}
