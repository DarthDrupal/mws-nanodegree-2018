importScripts('/js/idb.js');
importScripts('/js/dbhelper.js');

var staticCacheName = 'mws-restarurants-51';

function syncFavorite() {
  return new Promise(function (resolve, reject) {
    idb.open('restaurants-db', 4).then((db) => {
      if (!db) return;
      const tx = db.transaction('restaurants', 'readwrite');
      const store = tx.objectStore('restaurants');
      const storeIndex = store.index('needs-sync');

      storeIndex.getAll(1).then(function (restaurants) {
        restaurants.forEach(function (restaurant) {
          fetch(`${DBHelper.DATABASE_URL}restaurants/${restaurant.id}/?is_favorite=${restaurant.is_favorite}`, {
            method: "PUT"
          }).then(function (response) {
            return response.json();
          }).then(function (data) {
            const tx = db.transaction('restaurants', 'readwrite');
            const store = tx.objectStore('restaurants');
            data.needs_sync = 0;
            store.put(data);
            resolve('synced');
          }).catch(function (error) {
            reject(error);
          });
        });
      });
    });
  });
}

function syncReviews() {
  return new Promise(function (resolve, reject) {
    idb.open('restaurants-db', 4).then((db) => {
      if (!db) return;
      const tx = db.transaction('reviews', 'readwrite');
      const store = tx.objectStore('reviews');
      const storeIndex = store.index('by-serverid');

      storeIndex.getAll('').then(function (reviews) {
        console.log('Reviews: ' + JSON.stringify(reviews));
        reviews.forEach(function (review) {
          fetch(`${DBHelper.DATABASE_URL}reviews/`, {
            method: "POST",
            body: JSON.stringify(review)
          }).then(function (response) {
            return response.json();
          }).then(function (data) {
            const tx = db.transaction('reviews', 'readwrite');
            const store = tx.objectStore('reviews');
            store.get(review.local_id).then((review) => {
              data.local_id = review.local_id;
              store.put(data);
              resolve('synced');
            })
          }).catch(function (error) {
            reject(error);
          });
        });
      });
    });
  });
}

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

self.addEventListener('sync', event => {
  if (event.tag == 'sync-favorite') {
    event.waitUntil(syncFavorite());
  }

  if (event.tag == 'sync-reviews') {
    event.waitUntil(syncReviews());
  }
});

self.addEventListener('message', function (event) {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});