import { Skeleton, SkeletonAvatar } from '../Skeleton';
import { StatCardSkeleton, AppointmentCardSkeleton, QuickActionSkeleton, ClientCardSkeleton, ProductCardSkeleton } from './CardSkeleton';

/**
 * Skeleton for Home page
 */
export function HomeSkeleton() {
    return (
        <div className="pb-24 pt-6 px-4 md:px-8 max-w-7xl mx-auto space-y-8 animate-pulse">
            {/* Header */}
            <header className="flex flex-col gap-1 mb-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-5 w-64" />
            </header>

            {/* Action Center placeholder */}
            <Skeleton className="h-24 w-full rounded-2xl" />

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCardSkeleton />
                <StatCardSkeleton />
                <div className="col-span-2 md:col-span-1">
                    <StatCardSkeleton />
                </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3 overflow-x-auto pb-2">
                <QuickActionSkeleton />
                <QuickActionSkeleton />
                <QuickActionSkeleton />
            </div>

            {/* Upcoming Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-20" />
                </div>
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <AppointmentCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        </div>
    );
}

/**
 * Skeleton for Clients page
 */
export function ClientsPageSkeleton() {
    return (
        <div className="pb-24 pt-6 px-4 md:px-8 max-w-7xl mx-auto">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <Skeleton className="h-8 w-32 mb-2" />
                    <Skeleton className="h-5 w-48" />
                </div>
                <Skeleton className="h-12 w-40 rounded-xl" />
            </header>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <Skeleton className="h-12 flex-1 rounded-xl" />
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-16 rounded-lg" />
                    <Skeleton className="h-10 w-16 rounded-lg" />
                    <Skeleton className="h-10 w-16 rounded-lg" />
                    <Skeleton className="h-10 w-16 rounded-lg" />
                </div>
            </div>

            {/* Client Cards */}
            <div className="flex flex-col gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <ClientCardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}

/**
 * Skeleton for Inventory page
 */
export function InventoryPageSkeleton() {
    return (
        <div className="pb-24 bg-background-light min-h-screen">
            {/* Header */}
            <header className="flex items-center justify-between p-6 pb-2">
                <Skeleton className="h-7 w-24" />
                <Skeleton className="w-10 h-10 rounded-full" />
            </header>

            {/* Stats */}
            <div className="px-5 py-4">
                <div className="grid grid-cols-3 gap-4">
                    <Skeleton className="h-20 rounded-2xl" />
                    <Skeleton className="h-20 rounded-2xl" />
                    <Skeleton className="h-20 rounded-2xl" />
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col gap-4 px-5 pt-4">
                <Skeleton className="h-11 w-full rounded-xl" />
                <div className="flex gap-3">
                    <Skeleton className="h-9 w-28 rounded-xl" />
                    <Skeleton className="h-9 w-28 rounded-xl" />
                    <Skeleton className="h-9 w-28 rounded-xl" />
                </div>
            </div>

            {/* Product Cards */}
            <div className="flex flex-col gap-4 px-5 mt-6">
                <Skeleton className="h-6 w-28" />
                {Array.from({ length: 4 }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}

/**
 * Skeleton for Settings page
 */
export function SettingsPageSkeleton() {
    return (
        <div className="pb-24">
            {/* Header */}
            <header className="p-4 pb-2 border-b border-slate-100">
                <Skeleton className="h-6 w-20 mx-auto" />
            </header>

            {/* Profile Summary */}
            <div className="px-4 pt-6 pb-2">
                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <Skeleton className="w-16 h-16 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-3 w-40" />
                    </div>
                    <Skeleton className="w-10 h-10 rounded-lg" />
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="px-4 py-3">
                <Skeleton className="h-12 w-full rounded-xl" />
            </div>

            {/* Content */}
            <div className="px-4 space-y-4">
                <Skeleton className="h-6 w-40" />
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-11 w-full rounded-xl" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-11 w-full rounded-xl" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-11 w-full rounded-xl" />
                    </div>
                    <Skeleton className="h-12 w-full rounded-xl" />
                </div>
            </div>
        </div>
    );
}
