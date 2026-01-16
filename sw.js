// Service Worker for Servis Formu PWA

const CACHE_NAME = 'servis-formu-v10'; // Versiyon güncellendi v10
const urlsToCache = [
    '/',
    '/index.html',
    '/styles-v2.css',
    '/app-v2.js',
    '/manifest.json',
    '/logo.png',
    '/kase.jpg',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
]; // Kaşe eklendi // Logo eklendi
'/icons/icon-192.png',
    '/icons/icon-512.png'
];

// Install event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
    self.skipWaiting();
});

// Fetch event - NetworkFirst Strategy
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request)
            .then(networkResponse => {
                // Check if we received a valid response
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }

                // Clone and cache the new response
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME)
                    .then(cache => {
                        cache.put(event.request, responseToCache);
                    });

                return networkResponse;
            })
            .catch(() => {
                // If network fails, return from cache
                return caches.match(event.request);
            })
    );
});

// Activate event
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});
