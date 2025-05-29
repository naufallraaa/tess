import {
  generateStoryDetailErrorTemplate,
  generateStoryDetailTemplate,
  generateSaveStoryButtonTemplate,
  generateRemoveStoryButtonTemplate,
  generateLoaderAbsoluteTemplate,
} from '../../templates';
import StoryDetailPresenter from './story-detail-presenter';
import { parseActivePathname } from '../../routes/url-parser';
import Map from '../../utils/map';
import * as StoryAPI from '../../data/api';
import IdbSource from '../../data/idb-source';

export default class StoryDetailPage {
  constructor() {
    this.presenter = null;
    this.map = null;
  }

  /**
   * Render the initial HTML structure for the story detail page.
   */
  async render() {
    return `
      <section class="story-detail-container">
        <div class="container">
          <a href="#/home" class="back-button" aria-label="Back to stories list">
            <i class="fas fa-arrow-left"></i> Back to Stories
          </a>
        </div>
        <div id="story-detail" class="story-detail"></div>
        <div id="story-detail-loading-container" class="story-detail-loading"></div>
      </section>
    `;
  }

  /**
   * Called after render, initialize presenter and load story.
   */
  async afterRender() {
    const storyId = parseActivePathname().id;
    if (!storyId) {
      this.showStoryDetailError('Story ID not found');
      return;
    }

    this.presenter = new StoryDetailPresenter(storyId, {
      view: this,
      apiModel: StoryAPI,
    });

    this.presenter.showStoryDetail();
  }

  /**
   * Populate the page with story details and init map.
   */
  async populateStoryDetailAndInitialMap(message, story) {
    try {
      if (!story) throw new Error('Story data is missing');

      // Fallback for location if incomplete
      const location = {
        lat: story.location?.lat ?? 0,
        lon: story.location?.lon ?? 0,
        placeName: story.location?.placeName ?? 'Unknown location',
      };

      document.getElementById('story-detail').innerHTML = generateStoryDetailTemplate({
        name: story.name ?? 'Unknown',
        description: story.description ?? 'No description available',
        photoUrl: story.photoUrl,
        location,
        createdAt: story.createdAt ?? new Date().toISOString(),
      });

      await this.initMap(location);

      // Show save, share, and offline buttons
      this.presenter.showSaveButton();
      this.addShareEventListener();
      await this.renderSaveOfflineButton(story);

    } catch (error) {
      console.error('Error populating story detail:', error);
      this.showStoryDetailError('Error displaying story details. Please try again.');
    }
  }

  /**
   * Show an error message in the story detail container.
   */
  showStoryDetailError(message) {
    document.getElementById('story-detail').innerHTML = generateStoryDetailErrorTemplate(message);
  }

  /**
   * Initialize the map for the story's location.
   */
  async initMap(location) {
    try {
      const mapElement = document.getElementById('map');
      if (!mapElement) {
        console.error('Map element not found');
        return;
      }
      mapElement.style.backgroundColor = '#f0f0f0';

      this.map = await Map.build('#map', { zoom: 15 });

      if (!this.map) {
        this.showMapError(mapElement);
        return;
      }

      // If valid coordinate, add marker
      const { lat, lon } = location;
      if ((lat !== 0 || lon !== 0) && !isNaN(Number(lat)) && !isNaN(Number(lon))) {
        const markerOptions = { alt: `${location.placeName}` };
        const popupOptions = { content: `Story was shared from here` };
        this.map.changeCamera([lat, lon], 15);
        this.map.addMarker([lat, lon], markerOptions, popupOptions);
      } else {
        console.warn('Story has invalid coordinates', location, 'using default map view');
      }
    } catch (error) {
      console.error('Error initializing map:', error);
      const mapElement = document.getElementById('map');
      if (mapElement) this.showMapError(mapElement);
    }
  }

  /**
   * Render a map error message.
   */
  showMapError(mapElement) {
    mapElement.innerHTML = `
      <div class="map-error">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Unable to load map. Please check your internet connection.</p>
      </div>
    `;
  }

  /**
   * Render the save for offline button, and handle its logic.
   */
  async renderSaveOfflineButton(story) {
    // Create button
    const saveOfflineBtn = document.createElement('button');
    saveOfflineBtn.id = 'save-offline-button';
    saveOfflineBtn.className = 'btn btn-outline';
    saveOfflineBtn.innerHTML = '<i class="fas fa-download"></i> Simpan Offline';

    // Check if already saved
    const storyId = this.presenter.getStoryId();
    const savedStory = await IdbSource.getStoryById(storyId);
    if (savedStory) {
      saveOfflineBtn.disabled = true;
      saveOfflineBtn.innerHTML = '<i class="fas fa-check"></i> Tersimpan Offline';
    }

    saveOfflineBtn.addEventListener('click', async () => {
      try {
        await IdbSource.saveStory({
          id: storyId,
          name: story.name,
          description: story.description,
          photoUrl: story.photoUrl,
          createdAt: story.createdAt,
          location: story.location,
        });
        saveOfflineBtn.disabled = true;
        saveOfflineBtn.innerHTML = '<i class="fas fa-check"></i> Tersimpan Offline';
        alert('Cerita berhasil disimpan untuk dibaca offline!');
      } catch (error) {
        console.error('Gagal menyimpan cerita offline:', error);
        alert('Gagal menyimpan cerita. Silakan coba lagi.');
      }
    });

    const actionsContainer = document.querySelector('.story-detail__actions');
    if (actionsContainer) actionsContainer.appendChild(saveOfflineBtn);
  }

  /**
   * Render the save button for bookmarks.
   */
  renderSaveButton() {
    const saveContainer = document.getElementById('save-actions-container');
    if (!saveContainer) return;

    saveContainer.innerHTML = generateSaveStoryButtonTemplate();
    document.getElementById('story-detail-save')?.addEventListener('click', async () => {
      const storyId = parseActivePathname().id;
      const response = await this.presenter.toggleBookmark({
        id: storyId,
        name: document.querySelector('.story-detail-title')?.textContent,
        description: document.querySelector('.story-detail__description')?.textContent,
        photoUrl: document.querySelector('.story-detail__image')?.src,
        createdAt: new Date().toISOString(),
        location: {
          lat: document.querySelector('.story-detail__location-coordinates')?.textContent.split('Latitude: ')[1]?.split('\n')[0],
          lon: document.querySelector('.story-detail__location-coordinates')?.textContent.split('Longitude: ')[1],
        },
      });
      if (response) alert('Story bookmarked successfully!');
    });
  }

  /**
   * Render the remove button for bookmarks.
   */
  renderRemoveButton() {
    const saveContainer = document.getElementById('save-actions-container');
    if (!saveContainer) return;

    saveContainer.innerHTML = generateRemoveStoryButtonTemplate();
    document.getElementById('story-detail-remove')?.addEventListener('click', async () => {
      const response = await this.presenter.toggleBookmark();
      if (!response) alert('Story removed from bookmarks!');
    });
  }

  /**
   * Add share button logic with fallback.
   */
  addShareEventListener() {
    const shareButton = document.getElementById('story-detail-share');
    if (!shareButton) return;

    shareButton.addEventListener('click', () => {
      if (navigator.share) {
        navigator
          .share({
            title: 'Check out this story on StoryShare',
            text: 'I found an interesting story on StoryShare!',
            url: window.location.href,
          })
          .catch((error) => console.log('Error sharing:', error));
      } else {
        alert('Sharing is not supported in your browser. Copy the URL to share manually.');
      }
    });
  }

  /**
   * Show loading indicator for story detail.
   */
  showStoryDetailLoading() {
    const loadingContainer = document.getElementById('story-detail-loading-container');
    if (loadingContainer) {
      loadingContainer.innerHTML = generateLoaderAbsoluteTemplate();
    }
  }

  /**
   * Hide loading indicator for story detail.
   */
  hideStoryDetailLoading() {
    const loadingContainer = document.getElementById('story-detail-loading-container');
    if (loadingContainer) {
      loadingContainer.innerHTML = '';
    }
  }

  /**
   * Show loading indicator for map.
   */
  showMapLoading() {
    const mapLoadingContainer = document.getElementById('map-loading-container');
    if (mapLoadingContainer) {
      mapLoadingContainer.innerHTML = generateLoaderAbsoluteTemplate();
    }
  }

  /**
   * Hide loading indicator for map.
   */
  hideMapLoading() {
    const mapLoadingContainer = document.getElementById('map-loading-container');
    if (mapLoadingContainer) {
      mapLoadingContainer.innerHTML = '';
    }
  }
}