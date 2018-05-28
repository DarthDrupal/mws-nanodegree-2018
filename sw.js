var staticCacheName = 'mws-restarurants-96';

/**
 * @description Listener to manage the newer version of the cache
 */
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.filter(function (cacheName) {
          return cacheName.startsWith('mws-restarurants-') &&
            cacheName != staticCacheName;
        }).map(function (cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

/**
 * @description Offline first implementation to cache all the generated requests
 * Source: https://jakearchibald.com/2014/offline-cookbook/#on-network-response
 */
self.addEventListener('fetch', function (event) {
  var requestUrl = new URL(event.request.url);
  console.log(requestUrl.pathname);
  console.log(requestUrl.origin + ' - ' + location.origin);
  if (requestUrl.pathname.startsWith('/restaurants') || requestUrl.pathname.startsWith('/reviews')) {
    return;
  }

  event.respondWith(
    caches.open(staticCacheName).then(function (cache) {
      return cache.match(event.request).then(function (response) {
        return response || fetch(event.request).then(function (response) {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    })
  );
});

self.addEventListener('message', function (event) {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});