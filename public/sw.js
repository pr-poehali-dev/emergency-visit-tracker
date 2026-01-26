const CACHE_NAME = 'mchs-visits-v4';

self.addEventListener('install', (event) => {
  console.log('[SW] Установка Service Worker v4');
  // Не кэшируем ничего при установке - будем кэшировать по мере запросов
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Активация Service Worker v4');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Удаление старого кэша:', cacheName);
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
            console.log('[SW] Из кэша:', url.pathname);
            return response;
          }
          
          console.log('[SW] Загрузка из сети:', url.pathname);
          return fetch(event.request).then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                console.log('[SW] Кэширую:', url.pathname);
                cache.put(event.request, responseToCache);
              });
            
            return response;
          }).catch((error) => {
            console.log('[SW] Ошибка загрузки, пытаюсь взять из кэша:', url.pathname, error);
            // Если офлайн - возвращаем базовую страницу из кэша
            return caches.match('/').then((cachedIndex) => {
              if (cachedIndex) {
                console.log('[SW] Возвращаю index.html из кэша');
                return cachedIndex;
              }
              // Пытаемся вернуть офлайн страницу
              return caches.match('/offline.html').then((offlinePage) => {
                if (offlinePage) {
                  console.log('[SW] Возвращаю offline.html');
                  return offlinePage;
                }
                console.error('[SW] Нет кэшированных страниц!');
                return new Response('Офлайн - нет кэшированных данных', {
                  status: 503,
                  statusText: 'Service Unavailable'
                });
              });
            });
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