// Minimal Service Worker for PWA
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open('stitch-store').then((cache) => {
            // Add key assets to cache
            return cache.addAll([
                '/',
                '/index.html',
                '/logo.png',
            ]);
        })
    );
});

// Network-First Strategy
self.addEventListener('fetch', (e) => {
    e.respondWith(
        fetch(e.request)
            .catch(() => caches.match(e.request))
    );
});
