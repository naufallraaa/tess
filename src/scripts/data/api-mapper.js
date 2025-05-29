import Map from '../utils/map';

/**
 * Maps and formats a story object for use in the UI, 
 * providing default values for missing fields and resolving the location name.
 * @param {Object} story - The raw story object.
 * @returns {Promise<Object>} Formatted story object with default values.
 */
export async function mapStoryData(story) {
  // Default story data if the provided story is incomplete
  const defaultStory = {
    id: 'undefined',
    name: 'Untitled Story',
    description: 'No description available',
    photoUrl: 'assets/images/default-placeholder.jpg',
    createdAt: new Date().toISOString(),
    location: { lat: 0, lon: 0, placeName: 'Location unknown' },
  };

  if (!story) {
    console.error('No story object provided');
    return defaultStory;
  }

  // Retrieve latitude and longitude with fallback to defaults
  const latitude = story.location?.lat ?? story.lat ?? 0;
  const longitude = story.location?.lon ?? story.lon ?? 0;

  // If the photo URL is not available, set to a default placeholder
  const imageUrl = story.photoUrl || 'assets/images/default-placeholder.jpg';

  let locationName = `${latitude}, ${longitude}`;

  // If valid coordinates are provided, attempt to resolve place name
  if (
    (latitude !== 0 || longitude !== 0) &&
    !isNaN(Number(latitude)) &&
    !isNaN(Number(longitude))
  ) {
    try {
      const resolvedPlaceName = await Map.getPlaceNameByCoordinate(Number(latitude), Number(longitude));
      if (resolvedPlaceName && resolvedPlaceName !== 'Location unknown') {
        locationName = resolvedPlaceName;
      }
    } catch (error) {
      console.error('Failed to retrieve place name:', error);
    }
  }

  return {
    id: story.id ?? defaultStory.id,
    name: story.name ?? defaultStory.name,
    description: story.description ?? defaultStory.description,
    photoUrl: imageUrl,
    createdAt: story.createdAt ?? defaultStory.createdAt,
    location: {
      lat: latitude,
      lon: longitude,
      placeName: locationName,
    },
  };
}
