import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useRef, useCallback } from 'react';

// Configure focus manager for intelligent refetching
// Only refetch if tab was hidden for more than 5 minutes
const FOCUS_REFETCH_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

// Create a singleton QueryClient with optimized defaults
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Data is considered fresh for 30 seconds
            staleTime: 30 * 1000,
            // Cache is garbage collected after 5 minutes of being unused
            gcTime: 5 * 60 * 1000,
            // Disable default window focus refetch - we handle it manually
            refetchOnWindowFocus: false,
            // Refetch when reconnecting to internet
            refetchOnReconnect: true,
            // Retry failed requests twice
            retry: 2,
            // Don't throw errors, let components handle them
            throwOnError: false,
        },
        mutations: {
            // Retry mutations once on failure
            retry: 1,
        },
    },
});

/**
 * Custom hook that handles intelligent visibility-based refetching.
 * Only refetches if tab was hidden for more than 5 minutes.
 */
function useSmartVisibilityRefetch() {
    const hiddenAtRef = useRef(null);

    const handleVisibilityChange = useCallback(() => {
        if (document.visibilityState === 'hidden') {
            // Track when the tab became hidden
            hiddenAtRef.current = Date.now();
        } else if (document.visibilityState === 'visible') {
            // Tab is now visible - check how long it was hidden
            const hiddenAt = hiddenAtRef.current;

            if (hiddenAt) {
                const hiddenDuration = Date.now() - hiddenAt;

                if (hiddenDuration > FOCUS_REFETCH_THRESHOLD_MS) {
                    // Tab was hidden for more than threshold - refetch all stale queries
                    console.log(`[QueryProvider] Tab hidden for ${Math.round(hiddenDuration / 1000)}s, refetching stale queries`);
                    queryClient.invalidateQueries({
                        refetchType: 'active',
                        stale: true
                    });
                } else {
                    // Tab was hidden briefly - skip refetch
                    console.log(`[QueryProvider] Tab hidden for ${Math.round(hiddenDuration / 1000)}s, skipping refetch`);
                }
            }

            // Reset the hidden timestamp
            hiddenAtRef.current = null;
        }
    }, []);

    useEffect(() => {
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [handleVisibilityChange]);
}

/**
 * QueryProvider component that wraps the app with React Query
 * and configures intelligent visibility-based refetching.
 */
export function QueryProvider({ children }) {
    // Setup custom visibility handler
    useSmartVisibilityRefetch();

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}

// Export queryClient for manual cache manipulation if needed
export { queryClient };
