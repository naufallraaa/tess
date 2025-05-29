import { mapStoryData } from '../../data/api-mapper';

export default class StoryDetailHandler {
  #storyId;
  #view;
  #apiService;

  constructor(storyId, { view, apiService }) {
    this.#storyId = storyId;
    this.#view = view;
    this.#apiService = apiService;
  }

  // Handle loading UI for the map, extendable for future updates
  async displayStoryMap() {
    this.#view.showMapLoading();
    try {
      // Additional map logic can be added here if required
    } catch (error) {
      console.error('Error displaying map:', error);
    } finally {
      this.#view.hideMapLoading();
    }
  }

  // Main logic for fetching story details, including location resolution and view population
  async displayStoryDetails() {
    this.#view.showStoryDetailLoading();
    try {
      const response = await this.#apiService.getStoryById(this.#storyId);

      if (!response.ok) {
        console.error('Error fetching story:', response);
        this.#view.showStoryDetailError(response.message);
        return;
      }

      if (!response.story) throw new Error('Story not found');

      // Normalize and resolve story location data
      const storyData = { ...response.story };
      if (!storyData.location && (storyData.lat !== undefined || storyData.lon !== undefined)) {
        storyData.location = {
          lat: storyData.lat,
          lon: storyData.lon,
        };
      } else if (!storyData.location) {
        storyData.location = { lat: 0, lon: 0 };
      }

      // Normalize placeName using storyMapper
      const story = await mapStoryData(storyData);

      this.#view.populateStoryDetailsAndMap(response.message, story);
    } catch (error) {
      console.error('Error displaying story details:', error);
      this.#view.showStoryDetailError(error.message || 'Error loading story details');
    } finally {
      this.#view.hideStoryDetailLoading();
    }
  }

  // Fetch and display comments for the story
  async fetchComments() {
    this.#view.showCommentsLoading();
    try {
      const response = await this.#apiService.getCommentsByStoryId(this.#storyId);
      this.#view.populateStoryComments(response.message, response.comments || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      this.#view.showCommentsError(error.message);
    } finally {
      this.#view.hideCommentsLoading();
    }
  }

  // Submit a new comment for the story
  async submitNewComment({ body }) {
    this.#view.showSubmitLoadingButton();
    try {
      const response = await this.#apiService.createCommentForStory(this.#storyId, { body });

      if (!response.ok) {
        console.error('Error posting comment:', response);
        this.#view.showNewCommentError(response.message);
        return;
      }

      this.#view.showNewCommentSuccess(response.message, response.data);
    } catch (error) {
      console.error('Error submitting comment:', error);
      this.#view.showNewCommentError(error.message);
    } finally {
      this.#view.hideSubmitLoadingButton();
    }
  }

  // Display save/remove button based on whether the story is bookmarked
  displaySaveButton() {
    if (this.#isStoryBookmarked()) {
      this.#view.renderRemoveButton();
    } else {
      this.#view.renderSaveButton();
    }
  }

  // Check if the story is bookmarked
  #isStoryBookmarked() {
    const { isBookmarked } = require('../../utils/auth');
    return isBookmarked(this.#storyId);
  }

  // Toggle the bookmark status of the story and update the UI
  async toggleBookmark(story) {
    const { isBookmarked, addBookmark, removeBookmark } = require('../../utils/auth');

    if (isBookmarked(this.#storyId)) {
      removeBookmark(this.#storyId);
      this.#view.renderSaveButton();
      return false;
    } else {
      addBookmark(story);
      this.#view.renderRemoveButton();
      return true;
    }
  }

  getStoryId() {
    return this.#storyId;
  }
}
