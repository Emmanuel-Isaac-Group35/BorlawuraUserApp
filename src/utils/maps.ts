// Configure the Google Maps API Key
const GOOGLE_MAPS_API_KEY = "AIzaSyCXzRyuiqH5qSnh1E5ka644etSb6gml6E4";

import * as Location from 'expo-location';

/**
 * Reverse Geocodes coordinates to a human-readable address using Google Maps API
 * Fallback to Expo Location if Google Maps fails
 */
export const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
  const fallbackGps = `GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  
  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY.includes("YOUR_")) {
    console.warn("Google Maps API Key not configured.");
    return await tryNativeGeocode(latitude, longitude) || fallbackGps;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      return data.results[0].formatted_address;
    }
    
    console.warn("Google Geocode failed (might be disabled):", data.status);
    return await tryNativeGeocode(latitude, longitude) || fallbackGps;
  } catch (error: any) {
    console.warn("Google Maps Reverse Geocode Error, trying native fallback:", error.message);
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
 * Calculates estimated distance and time between two points
 */
export const getDistanceMatrix = async (origins: string[], destinations: string[]) => {
  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY.includes("YOUR_")) return null;

  try {
    const originsStr = encodeURIComponent(origins.join('|'));
    const destinationsStr = encodeURIComponent(destinations.join('|'));
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originsStr}&destinations=${destinationsStr}&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Distance Matrix Error:", error);
    return null;
  }
};

/**
 * Searches for places based on user input (Autocomplete)
 */
export const fetchPlacesAutocomplete = async (input: string) => {
  if (!GOOGLE_MAPS_API_KEY || !input) return [];

  try {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_MAPS_API_KEY}&components=country:gh`; // Restricted to Ghana for BorlaWura
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK') {
      return data.predictions;
    }
    return [];
  } catch (error) {
    console.error("Places Autocomplete Error:", error);
    return [];
  }
};

/**
 * Gets detailed info (including coordinates) for a specific place ID
 */
export const fetchPlaceDetails = async (placeId: string) => {
  if (!GOOGLE_MAPS_API_KEY || !placeId) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_address,geometry&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK') {
      return {
        address: data.result.formatted_address,
        latitude: data.result.geometry.location.lat,
        longitude: data.result.geometry.location.lng,
      };
    }
    return null;
  } catch (error) {
    console.error("Place Details Error:", error);
    return null;
  }
};

export default { reverseGeocode, getDistanceMatrix, fetchPlacesAutocomplete, fetchPlaceDetails };
