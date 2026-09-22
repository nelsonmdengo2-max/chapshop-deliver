/* =====================================================================
   ChapShop service-worker.js v3 — NETWORK FIRST

   OLD version: saved pages forever and never checked the server.
   Result: users never saw your updates. Ever.

   THIS version:
   - Deletes all old saved pages when it activates
   - Always loads pages FRESH from the internet
   - Keeps only one fresh copy for true offline emergencies
   ===================================================================== */

self.addEventListener('install', function(e) {
    self.skipWaiting();
});

self.addEventListener('activate', function(e) {
    e.waitUntil(
        caches.keys().then(function(names) {
            // Delete ALL old caches (chapshop-v2 and anything else)
            return Promise.all(names.map(function(n) { return caches.delete(n); }));
        }).then(function() {
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', function(event) {
    // Only handle page visits — let everything else load normally
    if (event.request.mode === 'navigate') {
        event.respondWith(
            // Try the internet FIRST — always fresh
            fetch(event.request).then(function(response) {
                // Save a fresh copy for offline emergencies only
                var copy = response.clone();
                caches.open('chapshop-live').then(function(c) {
                    c.put(event.request, copy);
                });
                return response;
            }).catch(function() {
                // Internet is down — only NOW use the saved copy
                return caches.match(event.request).then(function(cached) {
                    return cached || new Response(
                        'You are offline. Check your internet connection and refresh.',
                        { status: 503, headers: { 'Content-Type': 'text/plain' } }
                    );
                });
            })
        );
    }
});
