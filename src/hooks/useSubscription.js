import { useAuth } from '../context/AuthContext';

export function useSubscription() {
    const { clinic } = useAuth();

    const tier = clinic?.subscription_tier || 'FREE_TRIAL';
    const status = clinic?.subscription_status || 'trialing';

    // Logic to determine if access is allowed
    // Allowed if:
    // 1. Status is 'active' or 'trialing'
    // 2. OR if status is 'past_due' (grace period logic could be added here)
    // 3. Status 'canceled' or 'unpaid' usually blocks access

    const isAccessAllowed = ['active', 'trialing', 'past_due'].includes(status);

    const isTrialing = status === 'trialing';

    // Helper to get numeric limits
    // Helper to get numeric limits
    const getPlanLimit = (resource) => {
        if (tier === 'free') {
            // Free limits (Starter Plan - Trial or Active)
            if (resource === 'max_staff') return 2;
            if (resource === 'max_appointments') return 200;
            if (resource === 'inventory') return false;
        } else {
            // Pro / Enterprise Limits (Pro Plan - Trial or Active)
            if (resource === 'max_staff') return 999;
            if (resource === 'max_appointments') return 9999;
            if (resource === 'inventory') return true;
        }
        return Infinity; // Default for unmatched resources
    };

    const canAccessFeature = (feature) => {
        if (!isAccessAllowed) return false;
        const limit = getPlanLimit(feature);
        if (typeof limit === 'boolean') return limit;
        return true;
    };

    return {
        tier,
        status,
        isAccessAllowed,
        isTrialing,
        canAccessFeature,
        getPlanLimit
    };
}
