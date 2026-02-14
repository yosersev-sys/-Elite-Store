const CACHE_NAME = 'souq-alasr-v2';
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

// تفعيل وتحديث الكاش
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// استراتيجية جلب البيانات: البحث في الكاش أولاً ثم الإنترنت
self.addEventListener('fetch', (event) => {
  // تخطي طلبات الـ API لترك معالجتها للـ ApiService في فرونت إند
  if (event.request.url.includes('api.php')) {
    return;
  }

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
    }).catch(() => {
      // إذا فشل كل شيء (أوفلاين تماماً ولم يجد الملف في الكاش)
      if (event.request.mode === 'navigate') {
        return caches.match('index.php');
      }
    })
  );
});