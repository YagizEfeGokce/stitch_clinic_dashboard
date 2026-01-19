import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
    cleanup();
});

// Mock Supabase
vi.mock('../lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
                    order: vi.fn(() => Promise.resolve({ data: [], error: null })),
                })),
                order: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
            insert: vi.fn(() => ({
                select: vi.fn(() => Promise.resolve({ data: [{}], error: null })),
            })),
            update: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve({ data: {}, error: null })),
            })),
            delete: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve({ error: null })),
            })),
        })),
        auth: {
            signInWithPassword: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
            signUp: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
            signOut: vi.fn(() => Promise.resolve({ error: null })),
            getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
            onAuthStateChange: vi.fn(() => ({
                data: { subscription: { unsubscribe: vi.fn() } }
            })),
        },
        storage: {
            from: vi.fn(() => ({
                upload: vi.fn(() => Promise.resolve({ data: {}, error: null })),
                getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/image.jpg' } })),
            })),
        },
    },
}));

// Mock PostHog Analytics
vi.mock('../lib/analytics', () => ({
    trackPageView: vi.fn(),
    trackEvent: vi.fn(),
    identifyUser: vi.fn(),
    initAnalytics: vi.fn(),
}));

// Mock Sentry
vi.mock('../lib/sentry', () => ({
    initSentry: vi.fn(),
    setSentryUser: vi.fn(),
    clearSentryUser: vi.fn(),
    captureError: vi.fn(),
    addBreadcrumb: vi.fn(),
    setContext: vi.fn(),
}));

// Mock Material Symbols (they won't render properly in tests)
global.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));
