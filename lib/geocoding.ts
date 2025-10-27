// Nominatim (OpenStreetMap) Geocoding - 100% Free, No API Key Required
// Documentation: https://nominatim.org/release-docs/latest/api/Search/

export interface AddressData {
  formattedAddress: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateProvince?: string;
  postalCode?: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
}

export interface GeocodingSuggestion {
  id: string;
  placeName: string;
  addressData: AddressData;
}

// Rate limiting: Nominatim requires max 1 request per second
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();
  
  return fetch(url, {
    headers: {
      'User-Agent': 'Bookin.social Rental Platform', // Required by Nominatim usage policy
    },
  });
}

/**
 * Search for addresses using Nominatim (OpenStreetMap) API
 * @param query - The search string
 * @param options - Optional parameters for the search
 * @returns Array of address suggestions
 */
export async function searchAddresses(
  query: string,
  options?: {
    limit?: number;
    countrycodes?: string; // Comma-separated ISO 3166-1 alpha2 codes
  }
): Promise<GeocodingSuggestion[]> {
  if (!query || query.trim().length < 3) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      q: query.trim(),
      format: 'json',
      addressdetails: '1',
      limit: (options?.limit || 5).toString(),
      ...(options?.countrycodes && { countrycodes: options.countrycodes }),
    });

    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
    const response = await rateLimitedFetch(url);

    if (!response.ok) {
      if (response.status === 503 || response.status === 429) {
        console.warn('Nominatim rate limit reached, please slow down typing...');
      } else {
        console.error('Nominatim search error:', response.statusText);
      }
      return [];
    }

    const results = await response.json();

    if (!Array.isArray(results) || results.length === 0) {
      return [];
    }

    return results.map((result: any) => {
      const address = result.address || {};
      
      // Extract address components
      const road = address.road || address.pedestrian || address.path || '';
      const houseNumber = address.house_number || '';
      const addressLine1 = houseNumber && road ? `${houseNumber} ${road}` : (road || result.display_name.split(',')[0]);
      const city = address.city || address.town || address.village || address.municipality || '';
      const stateProvince = address.state || address.province || address.region || '';
      const postalCode = address.postcode || '';
      const country = address.country || '';
      const countryCode = address.country_code?.toUpperCase() || '';

      const addressData: AddressData = {
        formattedAddress: result.display_name,
        addressLine1,
        city,
        stateProvince,
        postalCode,
        country,
        countryCode,
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
      };

      return {
        id: result.place_id.toString(),
        placeName: result.display_name,
        addressData,
      };
    });
  } catch (error) {
    console.error('Error searching addresses:', error);
    return [];
  }
}

/**
 * Reverse geocode coordinates to get address using Nominatim
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns Address data or null
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<AddressData | null> {
  try {
    const params = new URLSearchParams({
      lat: latitude.toString(),
      lon: longitude.toString(),
      format: 'json',
      addressdetails: '1',
    });

    const url = `https://nominatim.openstreetmap.org/reverse?${params.toString()}`;
    const response = await rateLimitedFetch(url);

    if (!response.ok) {
      console.error('Nominatim reverse geocode error:', response.statusText);
      return null;
    }

    const result = await response.json();

    if (!result || result.error) {
      return null;
    }

    const address = result.address || {};
    
    // Extract address components
    const road = address.road || address.pedestrian || address.path || '';
    const houseNumber = address.house_number || '';
    const addressLine1 = houseNumber && road ? `${houseNumber} ${road}` : (road || result.display_name.split(',')[0]);
    const city = address.city || address.town || address.village || address.municipality || '';
    const stateProvince = address.state || address.province || address.region || '';
    const postalCode = address.postcode || '';
    const country = address.country || '';
    const countryCode = address.country_code?.toUpperCase() || '';

    return {
      formattedAddress: result.display_name,
      addressLine1,
      city,
      stateProvince,
      postalCode,
      country,
      countryCode,
      latitude,
      longitude,
    };
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
}
