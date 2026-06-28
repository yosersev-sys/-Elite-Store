const CACHE_NAME = 'souq-alasr-v10';
const ASSETS_TO_CACHE = [
  'index.php',
  'manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap'
];

// تثبيت الـ Service Worker وتخزين الملفات الأساسية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// تفعيل وتحديث الكاش وإجبار المتصفح على تولي السيطرة فوراً
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim(); // تولي السيطرة الفورية على كل التبويبات المفتوحة
});

// استراتيجية جلب البيانات: جلب الصفحة من الإنترنت أولاً (Network First) للأبواب الملاحية، والكاش أولاً للأصول الثابتة
self.addEventListener('fetch', (event) => {
  // تخطي طلبات الـ API لترك معالجتها للـ ApiService في فرونت إند
  if (event.request.url.includes('api.php')) {
    return;
  }

  // استراتيجية الإنترنت أولاً (Network First) لطلبات التصفح (مثل index.php) لضمان التحديث التلقائي الفوري
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        })
        .catch(() => {
          // في حال عدم وجود إنترنت (أوفلاين)، نسحب النسخة الاحتياطية من الكاش
          return caches.match('index.php');
        })
    );
    return;
  }

  // استراتيجية الكاش أولاً (Cache First) للملفات والأصول الثابتة
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // تخزين نسخة من الملفات الجديدة تلقائياً (مثل صور المنتجات)
        if (event.request.url.startsWith('http')) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-orders') {
    event.waitUntil(
      clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'TRIGGER_SYNC' });
        });
      })
    );
  }
});