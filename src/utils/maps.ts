import * as Location from 'expo-location';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || '';
export const hasGoogleMapsApiKey = GOOGLE_MAPS_API_KEY.length > 0;

const buildRouteFallback = (
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): RouteResult => {
  const toRadians = (value: number) => value * Math.PI / 180;
  const earthRadiusMeters = 6371000;
  const dLat = toRadians(destLat - originLat);
  const dLng = toRadians(destLng - originLng);
  const lat1 = toRadians(originLat);
  const lat2 = toRadians(destLat);

  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceMeters = Math.max(Math.round(earthRadiusMeters * c), 50);
  const estimatedDurationSeconds = Math.max(Math.round(distanceMeters / 5.5), 60);
  const distanceKm = distanceMeters / 1000;
  const durationMinutes = Math.max(Math.round(estimatedDurationSeconds / 60), 1);

  return {
    durationText: `${durationMinutes} min${durationMinutes === 1 ? '' : 's'}`,
    durationSeconds: estimatedDurationSeconds,
    distanceText: distanceKm >= 1
      ? `${distanceKm.toFixed(1)} km`
      : `${distanceMeters} m`,
    distanceMeters,
    polyline: [
      { lat: originLat, lng: originLng },
      { lat: destLat, lng: destLng }
    ]
  };
};

/**
 * Decodes a Google Maps Directions API encoded polyline string into coordinates.
 */
function decodePolyline(encoded: string): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push({
      lat: lat / 1E5,
      lng: lng / 1E5
    });
  }
  return points;
}

/**
 * Reverse Geocodes coordinates to a human-readable address using Google Geocoding API
 * Fallback to Expo Native Location if key is missing or request fails
 */
export const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
  const fallbackGps = `GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn("Google Maps API Key is missing. Falling back to native geocoding.");
    return await tryNativeGeocode(latitude, longitude) || fallbackGps;
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    if (data.status === 'OK' && data.results && data.results[0]) {
      return data.results[0].formatted_address;
    }
    return await tryNativeGeocode(latitude, longitude) || fallbackGps;
  } catch (error: any) {
    console.warn("Google Geocode Error, trying native fallback:", error.message);
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

export interface RouteResult {
  durationText: string;
  durationSeconds: number;
  distanceText: string;
  distanceMeters: number;
  polyline: { lat: number; lng: number }[];
}

/**
 * Fetches a driving route with road-following polyline coordinates using Google Directions API
 */
export const fetchRoute = async (
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<RouteResult | null> => {
  if (!Number.isFinite(originLat) || !Number.isFinite(originLng) ||
      !Number.isFinite(destLat) || !Number.isFinite(destLng)) {
    return null;
  }

  if (!GOOGLE_MAPS_API_KEY) {
    console.warn("Google Maps API Key is missing. Cannot fetch route from Google.");
    return buildRouteFallback(originLat, originLng, destLat, destLng);
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${destLat},${destLng}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    if (data.status === 'OK' && data.routes && data.routes[0]) {
      const route = data.routes[0];
      const leg = route.legs[0];
      const points = decodePolyline(route.overview_polyline.points);
      
      return {
        durationText: leg.duration.text,
        durationSeconds: leg.duration.value,
        distanceText: leg.distance.text,
        distanceMeters: leg.distance.value,
        polyline: points,
      };
    }
    console.warn('Google Directions API returned non-OK status:', data.status);
    return buildRouteFallback(originLat, originLng, destLat, destLng);
  } catch (error) {
    console.error('Google Directions API Error:', error);
    return buildRouteFallback(originLat, originLng, destLat, destLng);
  }
};

/**
 * Calculates estimated distance and time between two points using Google Directions API
 * Mocks Google Distance Matrix response structure for compatibility
 */
export const getDistanceMatrix = async (origins: string[], destinations: string[]) => {
  try {
    const originCoords = origins[0].split(',').map(Number);
    const destCoords = destinations[0].split(',').map(Number);
    const route = await fetchRoute(originCoords[0], originCoords[1], destCoords[0], destCoords[1]);
    if (!route) return null;

    return {
      status: 'OK',
      rows: [
        {
          elements: [
            {
              status: 'OK',
              duration: {
                text: route.durationText,
                value: route.durationSeconds,
              },
              distance: {
                text: route.distanceText,
                value: route.distanceMeters,
              },
            },
          ],
        },
      ],
    };
  } catch (error) {
    console.error('Google Distance Matrix calculation Error:', error);
    return null;
  }
};

/**
 * Searches for places based on user input (Google Places Autocomplete API)
 */
export const fetchPlacesAutocomplete = async (input: string) => {
  if (!input) return [];

  if (!GOOGLE_MAPS_API_KEY) {
    console.warn("Google Maps API Key is missing. Autocomplete is unavailable.");
    return [];
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&components=country:gh&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    if (data.status === 'OK' && data.predictions) {
      return data.predictions.map((item: any) => ({
        place_id: item.place_id,
        description: item.description,
        structured_formatting: {
          main_text: item.structured_formatting.main_text,
          secondary_text: item.structured_formatting.secondary_text
        }
      }));
    }
    return [];
  } catch (error) {
    console.error("Google Places Autocomplete Error:", error);
    return [];
  }
};

/**
 * Gets detailed info (including coordinates) for a specific place ID using Google Place Details API
 */
export const fetchPlaceDetails = async (placeId: string) => {
  if (!placeId) return null;

  try {
    // Handle our legacy/fallback place_id format "lat:lng" (just in case)
    if (placeId.includes(':')) {
      const [lat, lng] = placeId.split(':').map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
          const displayName = await reverseGeocode(lat, lng);
          return {
              address: displayName,
              latitude: lat,
              longitude: lng,
          };
      }
      return null;
    }

    if (!GOOGLE_MAPS_API_KEY) {
      console.warn("Google Maps API Key is missing. Place details is unavailable.");
      return null;
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_address,geometry&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    if (data.status === 'OK' && data.result) {
      const { formatted_address, geometry } = data.result;
      return {
        address: formatted_address,
        latitude: geometry.location.lat,
        longitude: geometry.location.lng,
      };
    }
    return null;
  } catch (error) {
    console.error("Google Place Details Error:", error);
    return null;
  }
};

export default { reverseGeocode, getDistanceMatrix, fetchPlacesAutocomplete, fetchPlaceDetails, fetchRoute };
