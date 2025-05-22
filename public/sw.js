const CACHE_NAME = 'savoirs-insolites-v1';
const urlsToCache = [
  './index.html',
  './manifest.json',
  './favicon.ico',
  './assets'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Cache each URL individually to handle failures gracefully
        const cachePromises = urlsToCache.map(url => {
          // Attempt to cache each resource, but don't fail if one fails
          return cache.add(url).catch(error => {
            console.warn(`Failed to cache ${url}:`, error);
            return Promise.resolve(); // Continue despite error
          });
        });
        return Promise.all(cachePromises);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        // Clone the request because it can only be used once
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then(response => {
            // Check if response is valid
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response because it can only be used once
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              })
              .catch(error => {
                console.warn('Cache put failed:', error);
              });

            return response;
          })
          .catch(() => {
            // Return a fallback response if fetch fails
            return new Response('Network error occurred', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              return caches.delete(cacheName);
            }
            return Promise.resolve();
          })
        );
      })
      .catch(error => {
        console.warn('Cache cleanup failed:', error);
      })
  );
});