/* eslint-disable no-restricted-globals */

// Nama cache yang digunakan
const CACHE_VERSION = 'payconnect-v1';

// Daftar file yang akan disimpan dalam cache
const filesToCache = [
  '/',
  '/index.html',
  '/assets/images/custom-favicon.png',
  '/manifest.json',
  '/scripts/main.js',
  '/styles/base.css',
  '/styles/buttons.css',
  '/styles/forms.css',
  '/styles/header.css',
  '/styles/footer.css',
  '/styles/home.css',
  '/styles/story-item.css',
  '/styles/story-detail.css',
  '/styles/new-story.css',
  '/styles/maps.css',
  '/styles/auth.css',
  '/styles/bookmark.css',
  '/styles/loader.css',
  '/styles/welcome.css',
  '/styles/responsive.css',
  '/styles/transitions.css',
  '/assets/images/placeholder-image.jpg',
  '/assets/images/icons/icon-72x72.png',
  '/assets/images/icons/icon-96x96.png',
  '/assets/images/icons/icon-128x128.png',
  '/assets/images/icons/icon-144x144.png',
  '/assets/images/icons/icon-152x152.png',
  '/assets/images/icons/icon-192x192.png',
  '/assets/images/icons/icon-384x384.png',
  '/assets/images/icons/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css',
];

// Mengatur cache saat instalasi service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      console.log('Cache berhasil dibuka dan diisi');
      return cache.addAll(filesToCache);
    }),
  );
});

// Mengatur aktivasi service worker untuk membersihkan cache lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_VERSION;
          })
          .map((cacheName) => {
            return caches.delete(cacheName);
          }),
      );
    }),
  );
});

// Strategi Cache: Stale-While-Revalidate
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Jika permintaan berasal dari domain yang sama, gunakan cache
  if (requestUrl.origin === location.origin) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clonedResponse = networkResponse.clone();
              caches.open(CACHE_VERSION).then((cache) => {
                cache.put(event.request, clonedResponse);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Jika offline dan tidak ada di cache, tampilkan halaman offline
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            return null;
          });

        return response || fetchPromise;
      }),
    );
  } else {
    // Untuk permintaan ke API, gunakan jaringan terlebih dahulu
    event.respondWith(
      fetch(event.request)
        .then((response) => response)
        .catch(() => caches.match(event.request)),
    );
  }
});

// Menangani push notification dari server
self.addEventListener('push', (event) => {
  let notificationOptions = {
    title: 'Notifikasi Baru',
    options: {
      body: 'Ada cerita baru di StoryConnect!',
      icon: '/assets/images/icons/icon-192x192.png',
      badge: '/assets/images/icons/icon-72x72.png',
    },
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationOptions = {
        title: data.title || notificationOptions.title,
        options: {
          ...notificationOptions.options,
          body: data.message || notificationOptions.options.body,
          data: {
            url: data.url || '/',
          },
        },
      };
    } catch (error) {
      console.error('Gagal memproses data notifikasi:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationOptions.title, notificationOptions.options),
  );
});

// Menangani klik pada notifikasi untuk membuka URL terkait
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((windowClients) => {
        const isWindowOpen = windowClients.some((windowClient) => {
          if (windowClient.url === urlToOpen) {
            windowClient.focus();
            return true;
          }
          return false;
        });

        if (!isWindowOpen) {
          clients.openWindow(urlToOpen).catch((error) => {
            console.error('Gagal membuka jendela:', error);
          });
        }
      }),
  );
});
