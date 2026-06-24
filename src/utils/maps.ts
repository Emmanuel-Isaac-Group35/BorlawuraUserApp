import * as Location from 'expo-location';

export const hasGoogleMapsApiKey = false; // Using OpenStreetMap APIs exclusively

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
 * Decodes a polyline string into coordinates.
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
 * Reverse Geocodes coordinates using Nominatim API
 */
export const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
  const fallbackGps = `GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=jsonv2`,
      { headers: { 'User-Agent': 'BorlaWuraUserApp/1.0 (contact@borlawura.com)' } }
    );
    const data = await response.json();
    
    // First try to build a clean name from the address components
    if (data && data.address) {
      const addr = data.address;
      const cleanName = [addr.road || addr.pedestrian, addr.suburb || addr.neighbourhood, addr.city || addr.town || addr.village].filter(Boolean).join(', ');
      if (cleanName) return cleanName;
    }
    
    // Fallback to display_name but filter out Plus Codes
    if (data && data.display_name) {
      const parts = data.display_name.split(',').map((p: string) => p.trim());
      const filtered = parts.filter((p: string) => !/^[A-Z0-9]{4,8}\+[A-Z0-9]{2,3}$/.test(p));
      if (filtered.length > 0) return filtered.join(', ');
    }
    
    // If Nominatim fails to give a good name, try Native
    const nativeResult = await tryNativeGeocode(latitude, longitude);
    
    // If Native returns a plus code, fall back to GPS string
    if (nativeResult && !/^[A-Z0-9]{4,8}\+[A-Z0-9]{2,3}$/.test(nativeResult.split(',')[0])) {
        return nativeResult;
    }
    
    return fallbackGps;
  } catch (error: any) {
    console.warn("Nominatim Reverse Geocode Error, trying native fallback:", error.message);
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
 * Fetches a driving route using OSRM API
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

  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=polyline`
    );
    const data = await response.json();
    if (data.code === 'Ok' && data.routes && data.routes[0]) {
      const route = data.routes[0];
      const durationSeconds = route.duration;
      const distanceMeters = route.distance;
      const durationMinutes = Math.max(Math.round(durationSeconds / 60), 1);
      const distanceKm = distanceMeters / 1000;
      
      return {
        durationText: `${durationMinutes} min${durationMinutes === 1 ? '' : 's'}`,
        durationSeconds,
        distanceText: distanceKm >= 1 ? `${distanceKm.toFixed(1)} km` : `${Math.round(distanceMeters)} m`,
        distanceMeters,
        polyline: decodePolyline(route.geometry),
      };
    }
    console.warn('OSRM API returned non-OK status:', data.code);
    return buildRouteFallback(originLat, originLng, destLat, destLng);
  } catch (error) {
    console.error('OSRM API Error:', error);
    return buildRouteFallback(originLat, originLng, destLat, destLng);
  }
};

/**
 * Calculates estimated distance and time between two points using OSRM Route
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
    console.error('Distance Matrix calculation Error:', error);
    return null;
  }
};

/**
 * Searches for places using Photon API (OpenStreetMap data)
 */
export const fetchPlacesAutocomplete = async (input: string) => {
  if (!input) return [];

  try {
    const response = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(input)}&limit=5&lat=5.6037&lon=-0.1870`
    );
    const data = await response.json();
    if (data && data.features) {
      return data.features.map((f: any) => {
        const props = f.properties;
        const coords = f.geometry.coordinates; // [lng, lat]
        const description = [props.name, props.street, props.city, props.state, props.country].filter(Boolean).join(', ');
        
        return {
          place_id: `${coords[1]}:${coords[0]}:${encodeURIComponent(description)}`,
          description,
          structured_formatting: {
            main_text: props.name || props.street || '',
            secondary_text: [props.city, props.country].filter(Boolean).join(', ')
          }
        };
      }).filter((x: any) => x.description);
    }
    return [];
  } catch (error) {
    console.error("Places Autocomplete Error:", error);
    return [];
  }
};

/**
 * Gets detailed info (including coordinates) parsing our custom placeId
 */
export const fetchPlaceDetails = async (placeId: string) => {
  if (!placeId) return null;

  try {
    if (placeId.includes(':')) {
      const parts = placeId.split(':');
      if (parts.length >= 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        const address = parts.slice(2).join(':');
        
        if (!isNaN(lat) && !isNaN(lng)) {
            const displayName = address ? decodeURIComponent(address) : await reverseGeocode(lat, lng);
            return {
                address: displayName,
                latitude: lat,
                longitude: lng,
            };
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Place Details Error:", error);
    return null;
  }
};

export default { reverseGeocode, getDistanceMatrix, fetchPlacesAutocomplete, fetchPlaceDetails, fetchRoute };
