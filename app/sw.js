// ============================================================
// sw.js — Service Worker (PWA オフライン対応)
// キャッシュ戦略: アプリシェルをキャッシュ、データは常にネットワーク優先
// ============================================================

const CACHE_NAME = 'expense-app-v13';

// キャッシュするアプリシェルファイル（外部CDNは除く）
const APP_SHELL = [
  './',
  './index.html',
  './js/config.js',
  './js/auth.js',
  './js/api.js',
  './js/app.jsx',
  './manifest.json',
];

// オフライン表示用フォールバックページ
const OFFLINE_URL = './index.html';

// ---- Install: アプリシェルをキャッシュ ----
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] アプリシェルをキャッシュ中...');
      return cache.addAll(APP_SHELL);
    }).then(() => self.skipWaiting())
  );
});

// ---- Activate: 古いキャッシュを削除 ----
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log(`[SW] 古いキャッシュを削除: ${name}`);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ---- Fetch: リクエスト処理 ----
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Google API / CDN リクエスト → ネットワーク優先（キャッシュなし）
  if (
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('cdnjs.cloudflare.com') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('accounts.google.com')
  ) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // API呼び出しがオフラインで失敗した場合は何もしない
        return new Response(JSON.stringify({ error: 'オフラインです' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
    return;
  }

  // アプリシェル → キャッシュ優先（オフライン動作）
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        // 成功したレスポンスをキャッシュに保存
        if (response && response.status === 200 && response.type === 'basic') {
          const toCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, toCache);
          });
        }
        return response;
      }).catch(() => {
        // ナビゲーションリクエストがオフラインで失敗した場合はindex.htmlを返す
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
      });
    })
  );
});

// ---- Push通知（将来の拡張用） ----
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  const options = {
    body: data.body || '新しい通知があります',
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
    data: { url: data.url || './' },
  };
  event.waitUntil(
    self.registration.showNotification(data.title || '経費管理', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || './';
  event.waitUntil(clients.openWindow(url));
});
