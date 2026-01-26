const CACHE_NAME = 'mchs-visits-v3';
const urlsToCache = [
  '/',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache).catch((error) => {
          console.error('Cache addAll failed:', error);
        });
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // НЕ кэшируем data: и blob: URLs
  if (url.protocol === 'data:' || url.protocol === 'blob:') {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Стратегия для статических ресурсов приложения (Cache First)
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          
          return fetch(event.request).then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          }).catch(() => {
            // Если офлайн - возвращаем базовую страницу из кэша
            return caches.match('/');
          });
        })
    );
    return;
  }
  
  // Стратегия для API запросов (Network First with Cache Fallback)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Успешный ответ - кэшируем его
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Нет сети - пытаемся взять из кэша
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[SW] Возврат из кэша (офлайн):', event.request.url);
            return cachedResponse;
          }
          // Если это запрос к HTML - возвращаем главную страницу
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
          // Иначе возвращаем пустой ответ
          return new Response('Офлайн режим', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' })
          });
        });
      })
  );
});