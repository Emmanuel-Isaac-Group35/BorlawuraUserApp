import { NavigatrCore as Navigatr } from '@navigatr/core';
import * as Location from 'expo-location';

// Initialize Navigatr
const nav = new Navigatr();

/**
 * Reverse Geocodes coordinates to a human-readable address using Navigatr API
 * Fallback to Expo Location if Navigatr fails
 */
export const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
  const fallbackGps = `GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  
  try {
    const result = await nav.reverseGeocode({ lat: latitude, lng: longitude });
    
    if (result && result.displayName) {
      return result.displayName;
    }
    
    return await tryNativeGeocode(latitude, longitude) || fallbackGps;
  } catch (error: any) {
    console.warn("Navigatr Reverse Geocode Error, trying native fallback:", error.message);
    return await tryNativeGeocode(latitude, longitude) || fallbackGps;
  }
};

/**
 * Native device geocoding fallback
 */
async function tryNativeGeocode(latitude: number, longitude: number) {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (results && results[0]) {
      const { street, streetNumber, district, city, name } = results[0];
      return `${streetNumber || ''} ${street || name || ''}, ${district || city || ''}`.trim();
    }
  } catch (e) {
    console.log("Native geocode also failed");
  }
  return null;
}

/**
 * Calculates estimated distance and time between two points using Navigatr
 * Mocks Google Distance Matrix response structure for compatibility
 */
export const getDistanceMatrix = async (origins: string[], destinations: string[]) => {
  try {
    // Navigatr route is 1:1, so we take the first origin and first destination
    // Origins/Destinations are expected as "lat,lng" strings
    const originCoords = origins[0].split(',').map(Number);
    const destCoords = destinations[0].split(',').map(Number);

    const route = await nav.route({
      origin: { lat: originCoords[0], lng: originCoords[1] },
      destination: { lat: destCoords[0], lng: destCoords[1] },
      mode: 'drive'
    });

    // Transform Navigatr RouteResult to Google DistanceMatrix format
    return {
      status: 'OK',
      rows: [
        {
          elements: [
            {
              status: 'OK',
              duration: {
                text: route.durationText,
                value: route.durationSeconds
              },
              distance: {
                text: route.distanceText,
                value: route.distanceMeters
              }
            }
          ]
        }
      ]
    };
  } catch (error) {
    console.error("Navigatr Route Error:", error);
    return null;
  }
};

/**
 * Searches for places based on user input (Autocomplete)
 */
export const fetchPlacesAutocomplete = async (input: string) => {
  if (!input) return [];

  try {
    const results = await nav.autocomplete({ query: input, limit: 10 });
    
    // Map Navigatr AutocompleteResult to Google Places format
    return results.map(item => ({
      place_id: `${item.lat}:${item.lng}`, // Unique ID for compatibility with ':' separator to handle negative values
      description: item.displayName,
      structured_formatting: {
        main_text: item.name,
        secondary_text: `${item.city || ''} ${item.country || ''}`.trim()
      }
    }));
  } catch (error) {
    console.error("Navigatr Autocomplete Error:", error);
    return [];
  }
};

/**
 * Gets detailed info (including coordinates) for a specific place ID
 * Since we encoded coords in the place_id for autocomplete, we extract them here
 */
export const fetchPlaceDetails = async (placeId: string) => {
  if (!placeId) return null;

  try {
    // Handle our custom place_id format "lat:lng"
    const [lat, lng] = placeId.split(':').map(Number);
    
    if (!isNaN(lat) && !isNaN(lng)) {
        // Fetch detailed display name via reverse geocode
        const displayName = await reverseGeocode(lat, lng);
        return {
            address: displayName,
            latitude: lat,
            longitude: lng,
        };
    }
    return null;
  } catch (error) {
    console.error("Navigatr Place Details Error:", error);
    return null;
  }
};

export default { reverseGeocode, getDistanceMatrix, fetchPlacesAutocomplete, fetchPlaceDetails };
