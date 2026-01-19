import * as Sentry from '@sentry/react';
import { useEffect } from 'react';
import {
    useLocation,
    useNavigationType,
    createRoutesFromChildren,
    matchRoutes,
} from 'react-router-dom';

/**
 * Initialize Sentry error tracking.
 * Only runs in production mode.
 */
export function initSentry() {
    // Only initialize in production
    if (!import.meta.env.PROD || !import.meta.env.VITE_SENTRY_DSN) {
        if (import.meta.env.DEV) {
            console.log('[Sentry] Development mode - Sentry disabled');
        }
        return;
    }

    Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        environment: import.meta.env.MODE,
        release: import.meta.env.VITE_APP_VERSION || '1.0.0',

        integrations: [
            // Browser tracing for performance monitoring
            Sentry.browserTracingIntegration(),

            // React Router integration
            Sentry.reactRouterV7BrowserTracingIntegration({
                useEffect,
                useLocation,
                useNavigationType,
                createRoutesFromChildren,
                matchRoutes,
            }),

            // Session replay for debugging (captures user sessions on errors)
            Sentry.replayIntegration({
                maskAllText: true,      // Mask all text for privacy
                blockAllMedia: true,    // Block media for privacy
            }),
        ],

        // Performance monitoring - sample 10% of transactions
        tracesSampleRate: 0.1,

        // Session replay sampling
        replaysSessionSampleRate: 0.1,  // 10% of normal sessions
        replaysOnErrorSampleRate: 1.0,  // 100% of error sessions

        // Filter out non-critical errors
        beforeSend(event, hint) {
            const error = hint.originalException;

            // Don't send network errors (handled by toast)
            if (error?.message?.includes('NetworkError')) {
                return null;
            }

            // Don't send auth-related errors (handled by UI)
            if (error?.message?.includes('Auth session missing')) {
                return null;
            }

            // Don't send rate limit errors
            if (error?.message?.includes('rate limit')) {
                return null;
            }

            return event;
        },

        // Ignore common non-error messages
        ignoreErrors: [
            'ResizeObserver loop limit exceeded',
            'ResizeObserver loop completed with undelivered notifications',
            'Non-Error promise rejection captured',
        ],
    });
}

/**
 * Set user context for better error tracking.
 * Call after successful login.
 */
export function setSentryUser(user) {
    if (!import.meta.env.PROD || !import.meta.env.VITE_SENTRY_DSN) return;

    Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.full_name || user.email?.split('@')[0],
    });
}

/**
 * Clear user context on logout.
 */
export function clearSentryUser() {
    if (!import.meta.env.PROD || !import.meta.env.VITE_SENTRY_DSN) return;

    Sentry.setUser(null);
}

/**
 * Capture a custom error with context.
 * Use this instead of console.error in catch blocks.
 */
export function captureError(error, context = {}) {
    // Always log to console for debugging
    console.error('Error:', error, context);

    if (!import.meta.env.PROD || !import.meta.env.VITE_SENTRY_DSN) return;

    Sentry.captureException(error, {
        extra: context,
    });
}

/**
 * Add breadcrumb for tracking user actions.
 * Useful for understanding what led to an error.
 */
export function addBreadcrumb(message, data = {}, category = 'action') {
    if (!import.meta.env.PROD || !import.meta.env.VITE_SENTRY_DSN) return;

    Sentry.addBreadcrumb({
        message,
        category,
        level: 'info',
        data,
    });
}

/**
 * Set custom context/tag for filtering errors in Sentry dashboard.
 */
export function setContext(name, data) {
    if (!import.meta.env.PROD || !import.meta.env.VITE_SENTRY_DSN) return;

    Sentry.setContext(name, data);
}

// Re-export Sentry for direct access if needed
export { Sentry };
