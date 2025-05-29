import NewPresenter from './new-presenter';
import * as StoryAPI from '../../data/api';
import { generateLoaderAbsoluteTemplate } from '../../templates';
import Camera from '../../utils/camera';
import Map from '../../utils/map';
import { MAP_SERVICE_API_KEY } from '../../config';

export default class NewPage {
  #presenter;
  #form;
  #camera;
  #isCameraOpen = false;
  #takenPhoto = null;
  #map = null;

  async render() {
    return `
      <section class="new-story-header">
        <div class="container">
          <h1 class="section-title">Bagikan Kisahmu</h1>
          <p class="section-subtitle">Fill out the form below to share your story with the world</p>
        </div>
      </section>
      
      <div class="section-divider"></div>
  
      <section class="container">
        <div class="new-story-form-container">
          <form id="new-form" class="new-story-form">
            <div class="form-card">
              <h2 class="form-card-title"><i class="fas fa-pen"></i>Isi Ceritamu</h2>
              <div class="form-control">
                <label for="description-input" class="form-label">Bagikan Ceritamu</label>
                <textarea
                  id="description-input"
                  name="description"
                  placeholder="Bagikan Kisahmu di sini"
                  class="form-textarea"
                  aria-describedby="description-input-more-info"
                  required
                ></textarea>
                <div id="description-input-more-info" class="form-help">Tulis ceritamu dengan kreatif dan semenarik mungkin!</div>
              </div>
            </div>

            <div class="form-card">
              <h2 class="form-card-title"><i class="fas fa-camera"></i> Tambah Poto</h2>
              <div class="form-control">
                <label class="form-label">Photo</label>
                <div id="photo-more-info" class="form-help">Tambahkan foto dari ceritamu</div>
  
                <div class="new-form__photo__container">
                  <div class="new-form__photo__buttons">
                    <button id="photo-input-button" class="btn btn-outline" type="button" aria-label="Unggah Foto">
                      <i class="fas fa-upload"></i> Unggah Foto
                    </button>
                    <input
                      id="photo-input"
                      name="photo"
                      type="file"
                      accept="image/*"
                      hidden="hidden"
                      aria-describedby="photo-more-info"
                    >
                    <button id="open-photo-camera-button" class="btn btn-outline" type="button" aria-label="Buka Kamera">
                      <i class="fas fa-camera"></i> Buka Kamera
                    </button>
                  </div>
                  <div id="camera-container" class="new-form__camera__container">
                    <video id="camera-video" class="new-form__camera__video">
                      Perangkat tidak terdeteksi.
                    </video>
                    <canvas id="camera-canvas" class="new-form__camera__canvas"></canvas>
  
                    <div class="new-form__camera__tools">
                      <select id="camera-select" aria-label="Pilih perangkat"></select>
                      <div class="new-form__camera__tools_buttons">
                        <button id="camera-take-button" class="btn" type="button" aria-label="Ambil Foto">
                          <i class="fas fa-camera"></i> Ambil Foto
                        </button>
                      </div>
                    </div>
                  </div>
                  <div id="photo-preview-container" class="new-form__photo__preview">
                    <img id="photo-preview" src="/placeholder.svg" alt="Your photo preview will appear here" style="display: none;">
                    <button id="remove-photo-button" class="btn btn-outline" type="button" style="display: none;" aria-label="Hapus Foto">
                      <i class="fas fa-times"></i> Hapus Foto
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-card">
              <h2 class="form-card-title"><i class="fas fa-map-marker-alt"></i> Lokasi</h2>
              <div class="form-control">  
                <div class="new-form__location__container">
                  <div class="new-form__location__map__container">
                    <div id="map" class="new-form__location__map"></div>
                    <div id="map-loading-container"></div>
                  </div>
                  <p class="new-form__location__help">Klik di map dimana cerita itu terjadi</p>
                  <div class="new-form__location__lat-lng">
                    <div class="input-group">
                      <i class="fas fa-map-pin input-icon"></i>
                      <input type="number" name="lat" id="lat-input" aria-label="Latitude" placeholder="Latitude" required step="any">
                    </div>
                    <div class="input-group">
                      <i class="fas fa-map-pin input-icon"></i>
                      <input type="number" name="lon" id="lon-input" aria-label="Longitude" placeholder="Longitude" required step="any">
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-buttons new-story-form-buttons">
              <span id="submit-button-container">
                <button class="btn" type="submit" aria-label="Bagikan Cerita">
                  <i class="fas fa-paper-plane"></i> Bagikan Cerita
                </button>
              </span>
              <a class="btn btn-outline" href="#/home" aria-label="Cancel" id="cancel-story-btn">
                <i class="fas fa-times"></i> Batalkan
              </a>
            </div>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new NewPresenter({
      view: this,
      model: StoryAPI,
    });
    this.#takenPhoto = null;

    if (!MAP_SERVICE_API_KEY || MAP_SERVICE_API_KEY === 'YOUR_KEY') {
      console.warn('Map API key is not configured. Map functionality may be limited.');
    }

    this.#presenter.showNewFormMap();
    this.#setupForm();
    this.#setupPhotoHandling();
    this.#setupCancelButton();
  }

  async initialMap() {
    try {
      const mapElement = document.getElementById('map');
      if (!mapElement) {
        console.error('Map element not found');
        return;
      }

      mapElement.style.backgroundColor = '#f0f0f0';

      this.#map = await Map.build('#map', {
        zoom: 15,
        locate: true,
      });

      if (!this.#map) {
        console.error('Failed to create map instance');
        return;
      }

      this.#map.addClickEvent((e) => {
        const { lat, lng } = e.latlng;
        document.getElementById('lat-input').value = lat;
        document.getElementById('lon-input').value = lng;

        this.#map.clearMarkers();
        this.#map.addMarker(
          [lat, lng],
          {},
          {
            content: `
            <div class="location-popup">
              <strong>Selected Location</strong>
              <p>Latitude: ${lat.toFixed(6)}<br>Longitude: ${lng.toFixed(6)}</p>
            </div>
          `,
          },
        );
      });
    } catch (error) {
      console.error('Error initializing map:', error);
      const mapElement = document.getElementById('map');
      if (mapElement) {
        mapElement.innerHTML = `
          <div class="map-error">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Unable to load map. Please check your internet connection.</p>
          </div>
        `;
      }
    }
  }

  #setupForm() {
    this.#form = document.getElementById('new-form');
    this.#form.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (!this.#takenPhoto) {
        alert('Please add a photo to your story');
        return;
      }

      const data = {
        description: this.#form.elements.namedItem('description').value,
        photo: this.#takenPhoto,
        lat: this.#form.elements.namedItem('lat').value,
        lon: this.#form.elements.namedItem('lon').value,
      };
      await this.#presenter.postNewStory(data);
    });
  }

  #setupPhotoHandling() {
    document.getElementById('photo-input')?.addEventListener('change', async (event) => {
      if (event.target.files && event.target.files[0]) {
        this.#takenPhoto = event.target.files[0];
        this.#displayPhotoPreview(URL.createObjectURL(this.#takenPhoto));
      }
    });

    document.getElementById('photo-input-button')?.addEventListener('click', () => {
      document.getElementById('photo-input')?.click();
    });

    const cameraContainer = document.getElementById('camera-container');
    document.getElementById('open-photo-camera-button')?.addEventListener('click', async (event) => {
      cameraContainer.classList.toggle('open');
      this.#isCameraOpen = cameraContainer.classList.contains('open');

      if (this.#isCameraOpen) {
        event.currentTarget.innerHTML = '<i class="fas fa-times"></i> Tutup Kamera';
        this.#setupCamera();
        await this.#camera.launch();
        return;
      }

      event.currentTarget.innerHTML = '<i class="fas fa-camera"></i> Buka Kamera';
      this.#camera.stop();
    });

    document.getElementById('remove-photo-button')?.addEventListener('click', () => {
      this.#takenPhoto = null;
      document.getElementById('photo-preview').style.display = 'none';
      document.getElementById('remove-photo-button').style.display = 'none';
    });
  }

  #setupCamera() {
    if (!this.#camera) {
      this.#camera = new Camera({
        video: document.getElementById('camera-video'),
        cameraSelect: document.getElementById('camera-select'),
        canvas: document.getElementById('camera-canvas'),
      });
    }

    this.#camera.addCheeseButtonListener('#camera-take-button', async () => {
      const imageBlob = await this.#camera.takePicture();
      this.#takenPhoto = imageBlob;
      this.#displayPhotoPreview(URL.createObjectURL(imageBlob));

      document.getElementById('camera-container')?.classList.remove('open');
      document.getElementById('open-photo-camera-button').innerHTML =
        '<i class="fas fa-camera"></i> Open Camera';
      this.#isCameraOpen = false;
      this.#camera.stop();
    });
  }

  #displayPhotoPreview(imageUrl) {
    const previewImg = document.getElementById('photo-preview');
    previewImg.src = imageUrl;
    previewImg.style.display = 'block';
    document.getElementById('remove-photo-button').style.display = 'block';
  }

  #setupCancelButton() {
    document.getElementById('cancel-story-btn')?.addEventListener('click', () => {
      this.clearForm();
    });
  }

  storeSuccessfully(message) {
    console.log(message);
    this.clearForm();
    location.hash = '/home';
  }

  storeFailed(message) {
    alert(message);
  }

  clearForm() {
    this.#form?.reset();
    this.#takenPhoto = null;
    document.getElementById('photo-preview').style.display = 'none';
    document.getElementById('remove-photo-button').style.display = 'none';
  }

  showMapLoading() {
    document.getElementById('map-loading-container').innerHTML = generateLoaderAbsoluteTemplate();
  }

  hideMapLoading() {
    document.getElementById('map-loading-container').innerHTML = '';
  }

  showSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
      <button class="btn" type="submit" disabled aria-label="Bagikan Cerita">
        <i class="fas fa-spinner loader-button">Bagikan Cerita</i> 
      </button>
    `;
  }

  hideSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
      <button class="btn" type="submit" aria-label="Bagikan Cerita">
        <i class="fas fa-paper-plane"></i> Bagikan Cerita
      </button>
    `;
  }
}