STATIC_CACHE_NAME = "static-nosleepfix";
DATA_CACHE_NAME = "data-pleasework3";

STATIC_CACHE_FILES = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/sw-control.js",
  "/timesync.js",
  "/countdown.js",
  "/nosleep-min.js",
  "/sound.mp3",
  "/Roboto-Regular.ttf"
]
DATA_CACHE_FILES = [
  "/data.js"
]

NO_CACHE = [
  "https://catherapyservices.ca/timesync/"
]

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then(
        cache => cache.addAll(STATIC_CACHE_FILES)
      ),
      caches.open(DATA_CACHE_NAME).then(
        cache => cache.addAll(DATA_CACHE_FILES)
      )
    ])
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    self.clients.claim(),
    caches.keys().then(
      keyList => Promise.all(keyList.map((key) => {
        if (key !== STATIC_CACHE_NAME 
          && key !== DATA_CACHE_NAME) {
          return caches.delete(key);
        }
      }))
    )
  ]));
});

self.addEventListener('fetch', event => {
  if (NO_CACHE.includes(event.request.url)) {
    event.respondWith(
      fetch(event.request, {cache: "no-store"}).then(response => {return response})
    );
  }
  else {
    event.respondWith(
      caches.match(event.request).then(response => {
        // caches.match() always resolves
        // but in case of success response will have value
        if (response !== undefined) {
          return response;
        } else {
          return fetch(event.request).then(response => {
            // response may be used only once
            // we need to save clone to put one copy in cache
            // and serve second one
            let responseClone = response.clone();
            
            let cacheToStore = STATIC_CACHE_NAME;
            if (event.request in DATA_CACHE_FILES) {
              cacheToStore = DATA_CACHE_NAME;
            }
            caches.open(cacheToStore).then(cache => {
              cache.put(event.request, responseClone);
            });
            return response;
          }).catch(() => {
            caches.match('data.js');
          });
        }
      })
    );
  }
});