import { getBookmarkedStories, removeBookmarkedStory } from '../../utils/auth';
import { generateStoryItemTemplate, generateLoaderAbsoluteTemplate } from '../../templates';
import IdbSource from '../../data/idb-source';

export default class BookmarkPage {
  async render() {
    return `
      <section class="container">
        <div class="bookmark-container">
          <h1 class="section-title">Bookmarked Stories</h1>
          
          <div class="bookmark-tabs">
            <button id="online-tab" class="bookmark-tab active">Online Bookmarks</button>
            <button id="offline-tab" class="bookmark-tab">Offline Stories</button>
          </div>
          
          <div id="bookmarked-stories-container" class="bookmark-content" aria-live="polite">
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.loadBookmarkedStories();
    this.setupTabs();
  }

  setupTabs() {
    const onlineTab = document.getElementById('online-tab');
    const offlineTab = document.getElementById('offline-tab');

    onlineTab.addEventListener('click', () => {
      onlineTab.classList.add('active');
      offlineTab.classList.remove('active');
      this.loadBookmarkedStories();
    });

    offlineTab.addEventListener('click', () => {
      offlineTab.classList.add('active');
      onlineTab.classList.remove('active');
      this.loadOfflineStories();
    });
  }

  async loadOfflineStories() {
    const container = document.getElementById('bookmarked-stories-container');
    container.innerHTML = generateLoaderAbsoluteTemplate();

    try {
      const stories = await IdbSource.getStories();

      if (!stories || stories.length === 0) {
        container.innerHTML = `
          <div class="bookmark-message">
            <i class="fas fa-database bookmark-icon"></i>
            <h2>Tidak Ada Cerita Offline</h2>
            <p>Anda belum menyimpan cerita apapun untuk dibaca offline. Kunjungi halaman detail cerita dan klik "Simpan Offline" untuk menyimpan cerita.</p>
            <a href="#/home" class="btn">Jelajahi Cerita</a>
          </div>
        `;
        return;
      }

      const html = stories.map((story) => generateStoryItemTemplate(story)).join('');

      container.innerHTML = `<div class="stories-list">${html}</div>`;

      const storyItems = container.querySelectorAll('.story-item');
      storyItems.forEach((item) => {
        const storyId = item.dataset.storyid;
        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-outline delete-offline-btn';
        deleteButton.innerHTML = '<i class="fas fa-trash"></i> Hapus Offline';
        deleteButton.addEventListener('click', async () => {
          if (confirm('Apakah Anda yakin ingin menghapus cerita ini dari penyimpanan offline?')) {
            await IdbSource.deleteStory(storyId);
            this.loadOfflineStories();
          }
        });
        item.querySelector('.story-item__body')?.appendChild(deleteButton);
      });
    } catch (error) {
      console.error('Error loading offline stories:', error);
      container.innerHTML = `
        <div class="bookmark-message">
          <i class="fas fa-exclamation-triangle bookmark-icon"></i>
          <h2>Gagal Memuat Cerita Offline</h2>
          <p>Terjadi kesalahan saat memuat cerita offline. Silakan coba lagi nanti.</p>
          <button class="btn" id="retry-offline-btn">Coba Lagi</button>
        </div>
      `;
      container.querySelector('#retry-offline-btn').addEventListener('click', () => this.loadOfflineStories());
    }
  }

  loadBookmarkedStories() {
    const bookmarkedStories = getBookmarkedStories();
    const container = document.getElementById('bookmarked-stories-container');

    if (!bookmarkedStories || bookmarkedStories.length === 0) {
      container.innerHTML = `
        <div class="bookmark-message">
          <i class="fas fa-bookmark bookmark-icon"></i>
          <h2>No Bookmarked Stories</h2>
          <p>Kamu belum mempunyai Bookmark.  Kunjungi halaman detail cerita dan klik "Bookmark" untuk menyimpan cerita.</p>
          <a href="#/home" class="btn">Browse Stories</a>
        </div>
      `;
      return;
    }

    const html = bookmarkedStories.map((story) => generateStoryItemTemplate(story)).join('');

    container.innerHTML = `<div class="stories-list">${html}</div>`;

    const storyItems = container.querySelectorAll('.story-item');
    storyItems.forEach((item) => {
      const storyId = item.dataset.storyid;
      const deleteButton = document.createElement('button');
      deleteButton.className = 'btn btn-outline delete-bookmark-btn';
      deleteButton.innerHTML = '<i class="fas fa-trash"></i> Hapus Bookmark';
      deleteButton.addEventListener('click', () => {
        if (confirm('Apakah Anda yakin ingin menghapus bookmark ini?')) {
          removeBookmarkedStory(storyId);
          this.loadBookmarkedStories();
        }
      });
      item.querySelector('.story-item__body')?.appendChild(deleteButton);
    });
  }
}