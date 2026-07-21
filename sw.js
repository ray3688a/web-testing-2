// 🚀 Hayden & Celine Service Worker
// 版本號：只有當你想強制清除所有快取時，才改這個數字
const CACHE_NAME = 'hayden-celine-v1';

// 安裝：立即啟用
self.addEventListener('install', event => {
  console.log('[SW] 安裝中...');
  self.skipWaiting();
});

// 啟動：接管所有頁面
self.addEventListener('activate', event => {
  console.log('[SW] 已啟動');
  event.waitUntil(self.clients.claim());
});

// 攔截所有網路請求
self.addEventListener('fetch', event => {
  const { request } = event;

  event.respondWith(
    // 1. 先看看本地快取有沒有
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        // 本地有！直接返回，0ms
        return cachedResponse;
      }

      // 2. 本地沒有，去網路抓
      return fetch(request).then(networkResponse => {
        // 只快取成功的 GET 請求
        if (networkResponse && networkResponse.status === 200 && request.method === 'GET') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      }).catch(err => {
        // 3. 網路也失敗了（離線），且本地也沒有
        console.warn('[SW] 離線且無快取:', request.url);
        // 對於 HTML 頁面，返回本地快取的首頁（如果有的話）
        if (request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        throw err;
      });
    })
  );
});
