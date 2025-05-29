import { openDB } from 'idb';

const DATABASE_NAME = 'story-db';
const DATABASE_VERSION = 2; // Ubah ke versi lebih tinggi
const OBJECT_STORE_NAME = 'stories';

const dbPromise = openDB(DATABASE_NAME, DATABASE_VERSION, {
  upgrade(database) {
    if (!database.objectStoreNames.contains(OBJECT_STORE_NAME)) {
      database.createObjectStore(OBJECT_STORE_NAME, { keyPath: 'id' });
    }
  },
});

const IdbSource = {
  async getStories() {
    return (await dbPromise).getAll(OBJECT_STORE_NAME);
  },

  async getStoryById(id) {
    return (await dbPromise).get(OBJECT_STORE_NAME, id);
  },

  async saveStory(story) {
    return (await dbPromise).put(OBJECT_STORE_NAME, story);
  },

  async deleteStory(id) {
    return (await dbPromise).delete(OBJECT_STORE_NAME, id);
  },

  async searchStories(query) {
    const stories = await this.getStories();
    return stories.filter((story) => {
      const searchableText = `${story.name} ${story.description}`.toLowerCase();
      return searchableText.includes(query.toLowerCase());
    });
  },
};

export default IdbSource;