import posthog from 'posthog-js';

const MOCK_MODE = import.meta.env.DEV && !import.meta.env.VITE_POSTHOG_KEY;

// Initialize
export const initAnalytics = () => {
    if (MOCK_MODE) {
        console.log('[Analytics] Mock Mode: PostHog not initialized (No Key).');
        return;
    }

    if (import.meta.env.VITE_POSTHOG_KEY) {
        posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
            api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
            loaded: (ph) => {
                if (import.meta.env.DEV) ph.opt_out_capturing(); // Optional: Don't track dev sessions
            }
        });
    }
};

// Track Page Views
export const trackPageView = (path) => {
    if (MOCK_MODE) {
        console.log(`[Analytics] Page View: ${path}`);
        return;
    }
    posthog.capture('$pageview');
};

// Track Custom Events
export const trackEvent = (eventName, properties = {}) => {
    if (MOCK_MODE) {
        console.log(`[Analytics] Event: ${eventName}`, properties);
        return;
    }
    posthog.capture(eventName, properties);
};

// Identify User (After Login)
export const identifyUser = (userId, traits = {}) => {
    if (MOCK_MODE) {
        console.log(`[Analytics] Identify: ${userId}`, traits);
        return;
    }
    posthog.identify(userId, traits);
};

// Reset (Logout)
export const resetAnalytics = () => {
    if (MOCK_MODE) return;
    posthog.reset();
};
