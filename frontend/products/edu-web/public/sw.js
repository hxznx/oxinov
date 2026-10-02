/*
 * Oxinov Edu service worker (FR-MOBILE-1504). It does one thing: when the installed app or a page is opened
 * without a connection, it shows /offline.html instead of the browser's error. It caches nothing else, so
 * no lesson, payment, or account page is ever stored on the device or shown out of date.
 */
const CACHE = 'oxinov-edu-offline-v1';
const OFFLINE = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll([OFFLINE, '/icons/icon-192.png']))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  // Only page loads; everything else goes to the network untouched.
  if (request.mode !== 'navigate' || request.method !== 'GET') return;
  event.respondWith(fetch(request).catch(() => caches.match(OFFLINE).then((page) => page || Response.error())));
});
