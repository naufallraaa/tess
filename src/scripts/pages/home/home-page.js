import NotificationHelper from '../../utils/notification-helper';
import {
  generateLoaderAbsoluteTemplate,
  generateStoryItemTemplate,
  generateStoriesListEmptyTemplate,
  generateStoriesListErrorTemplate,
} from '../../templates';
import HomePresenter from './home-presenter';
import Map from '../../utils/map';
import * as StoryAPI from '../../data/api';

export default class HomePage {
  constructor() {
    this.presenter = null;
    this.map = null;
  }

  async render() {
    const greeting = this.getGreeting();

    return `
      <section class="home-welcome-section">
        <div class="container">
          <div class="home-welcome-content">
            <h1 class="home-greeting">Bienvenido</h1>
            <p class="home-welcome-message">Ayo kirimkan story mu sekarang juga!!</p>
          </div>
        </div>
      </section>
      <div class="diamond-divider"></div>
      <section class="container stories-section" id="stories-section">
        <h2 class="section-title">Journey of Our Community</h2>
        <p class="section-subtitle">Explore unique stories from our members</p>
        <div class="stories-list__container">
          <div id="stories-list"></div>
          <div id="stories-list-loading-container"></div>
        </div>
      </section>
      <section class="map-section" id="map-section">
        <div class="container">
          <h2 class="section-title">Journeys Across the Globe</h2>
          <p class="section-subtitle">Explore inspiring stories from various places around the world</p>
        </div>
        <div class="stories-list__map__container">
          <div id="map" class="stories-list__map"></div>
          <div id="map-loading-container"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.presenter = new HomePresenter({
      view: this,
      model: StoryAPI,
    });

    await this.presenter.initialGalleryAndMap();

    const mapSection = document.getElementById('map-section');
    if (mapSection) mapSection.style.display = 'none';

    const storiesSection = document.getElementById('stories-section');
    if (storiesSection) {
      const viewMapBtn = document.createElement('button');
      viewMapBtn.className = 'btn btn-outline view-map-btn';
      viewMapBtn.innerHTML = '<i class="fas fa-map-marked-alt"></i> View Map';
      viewMapBtn.addEventListener('click', () => {
        if (mapSection) {
          mapSection.style.display = 'block';
          mapSection.scrollIntoView({ behavior: 'smooth' });
        }
      });
      storiesSection.appendChild(viewMapBtn);

      const notificationBtn = document.createElement('button');
      notificationBtn.className = 'btn btn-outline notification-btn';
      notificationBtn.innerHTML = '<i class="fas fa-bell"></i> Aktifkan Notifikasi';
      notificationBtn.addEventListener('click', async () => {
        try {
          const permissionGranted = await NotificationHelper.requestPermission();
          if (!permissionGranted) {
            alert('Mohon izinkan notifikasi untuk mendapatkan pembaruan terbaru');
            return;
          }
          const registration = await NotificationHelper.registerServiceWorker();
          if (!registration) {
            alert('Service Worker gagal didaftarkan');
            return;
          }
          const subscription = await NotificationHelper.subscribeNotification(registration);
          if (subscription) {
            alert('Notifikasi berhasil diaktifkan! Anda akan menerima pembaruan terbaru.');
            notificationBtn.disabled = true;
            notificationBtn.innerHTML = '<i class="fas fa-bell"></i> Notifikasi Aktif';
          }
        } catch (error) {
          console.error('Gagal mengaktifkan notifikasi:', error);
          alert('Gagal mengaktifkan notifikasi. Silakan coba lagi nanti.');
        }
      });
      storiesSection.appendChild(notificationBtn);
    }

    const visibleSkipButton = document.getElementById('visible-skip-button');
    if (visibleSkipButton) {
      visibleSkipButton.addEventListener('click', () => {
        if (storiesSection) {
          storiesSection.scrollIntoView({ behavior: 'smooth' });
          storiesSection.focus();
        }
      });
    }
  }

  getGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return 'Good Morning!';
    } else if (hour >= 12 && hour < 18) {
      return 'Good Afternoon!';
    } else {
      return 'Good Evening!';
    }
  }

  populateStoriesList(message, stories) {
    if (!stories || stories.length === 0) {
      this.populateStoriesListEmpty();
      return;
    }
    const html = stories.reduce((acc, story) => {
      let location = story.location;
      if (!location && (story.lat !== undefined || story.lon !== undefined)) {
        location = { lat: story.lat, lon: story.lon };
      } else if (!location) {
        location = { lat: 0, lon: 0 };
      }
      return acc + generateStoryItemTemplate({ ...story, location });
    }, '');
    const storiesListEl = document.getElementById('stories-list');
    if (storiesListEl) {
      storiesListEl.innerHTML = `<div class="stories-list">${html}</div>`;
    }
  }

  populateStoriesListEmpty() {
    const storiesListEl = document.getElementById('stories-list');
    if (storiesListEl) {
      storiesListEl.innerHTML = generateStoriesListEmptyTemplate();
    }
  }

  populateStoriesListError(message) {
    const storiesListEl = document.getElementById('stories-list');
    if (storiesListEl) {
      storiesListEl.innerHTML = generateStoriesListErrorTemplate(message);
    }
  }

  async initialMap() {
    try {
      this.map = await Map.build('#map', {
        zoom: 10,
        locate: true,
      });
      if (this.map) {
        const response = await StoryAPI.getAllStories();
        if (response.ok && response.listStory && response.listStory.length > 0) {
          for (const story of response.listStory) {
            let lat = story.location ? story.location.lat : story.lat;
            let lon = story.location ? story.location.lon : story.lon;
            if ((lat !== 0 || lon !== 0) && !isNaN(Number(lat)) && !isNaN(Number(lon))) {
              const popupContent = `
                <div class="story-location-popup">
                  <strong>${story.name}'s Story</strong>
                  <p>${story.description ? story.description.substring(0, 100) + (story.description.length > 100 ? '...' : '') : ''}</p>
                  <p class="story-location-coordinates">
                    Latitude: ${lat}<br>
                    Longitude: ${lon}
                  </p>
                  <a href="#/stories/${story.id}" class="popup-link">Read more</a>
                </div>
              `;
              this.map.addMarker(
                [lat, lon],
                { alt: `${story.name}'s story location` },
                { content: popupContent },
              );
            }
          }
        }
      }
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  showMapLoading() {
    const el = document.getElementById('map-loading-container');
    if (el) el.innerHTML = generateLoaderAbsoluteTemplate();
  }

  hideMapLoading() {
    const el = document.getElementById('map-loading-container');
    if (el) el.innerHTML = '';
  }

  showLoading() {
    const el = document.getElementById('stories-list-loading-container');
    if (el) el.innerHTML = generateLoaderAbsoluteTemplate();
  }

  hideLoading() {
    const el = document.getElementById('stories-list-loading-container');
    if (el) el.innerHTML = '';
  }
}