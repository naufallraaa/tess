// Import CSS
import '../styles/base.css';
import '../styles/buttons.css';
import '../styles/forms.css';
import '../styles/header.css';
import '../styles/footer.css';
import '../styles/home.css';
import '../styles/story-item.css';
import '../styles/story-detail.css';
import '../styles/new-story.css';
import '../styles/maps.css';
import '../styles/auth.css';
import '../styles/bookmark.css';
import '../styles/loader.css';
import '../styles/welcome.css';
import '../styles/responsive.css';
import '../styles/not-found.css';
import 'tiny-slider/dist/tiny-slider.css';
import 'leaflet/dist/leaflet.css';

const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      if (process.env.NODE_ENV === 'production') {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service worker berhasil didaftarkan:', registration);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              if (confirm('Versi baru aplikasi tersedia. Muat ulang sekarang?')) {
                window.location.reload();
              }
            }
          });
        });
      } else {
        console.log('Mode development: Service worker tidak didaftarkan');
      }
    } catch (error) {
      console.error('Gagal mendaftarkan service worker:', error);
    }
  }
};

window.addEventListener('load', registerServiceWorker);

import App from './pages/app';
import Camera from './utils/camera';

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App({
    content: document.getElementById('main-content'),
    drawerButton: document.getElementById('drawer-button'),
    drawerNavigation: document.getElementById('navigation-drawer'),
  });
  await app.renderPage();

  window.addEventListener('hashchange', async () => {
    await app.renderPage();

    Camera.stopAllStreams();
  });
});