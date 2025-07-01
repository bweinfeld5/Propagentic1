// Google Places API service for Baltimore business autocomplete
// Provides real-time business search with location bias towards Baltimore

interface PlacesPrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  terms: Array<{
    offset: number;
    value: string;
  }>;
  types: string[];
}

interface PlacesAutocompleteResponse {
  predictions: PlacesPrediction[];
  status: string;
  error_message?: string;
}

interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  business_status?: string;
  types: string[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

interface PlaceDetailsResponse {
  result: PlaceDetails;
  status: string;
  error_message?: string;
}

export interface BusinessInfo {
  placeId: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  businessStatus?: string;
  types: string[];
  isVerified: boolean;
}

declare global {
  interface Window {
    google: any;
  }
}

let googleMapsLoaded = false;
let googleMapsPromise: Promise<void> | null = null;

export const loadGoogleMapsAPI = (): Promise<void> => {
  if (googleMapsLoaded) {
    return Promise.resolve();
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google && window.google.maps) {
      googleMapsLoaded = true;
      resolve();
      return;
    }

    // Create script tag
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      googleMapsLoaded = true;
      resolve();
    };

    script.onerror = () => {
      reject(new Error('Failed to load Google Maps API'));
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
};

export const isGoogleMapsLoaded = (): boolean => {
  return googleMapsLoaded && window.google && window.google.maps;
};

// Geocoding service
export const geocodeAddress = async (address: string): Promise<google.maps.GeocoderResult[]> => {
  if (!isGoogleMapsLoaded()) {
    throw new Error('Google Maps API not loaded');
  }

  const geocoder = new window.google.maps.Geocoder();
  
  return new Promise((resolve, reject) => {
    geocoder.geocode({ address }, (results: google.maps.GeocoderResult[], status: google.maps.GeocoderStatus) => {
      if (status === window.google.maps.GeocoderStatus.OK) {
        resolve(results);
      } else {
        reject(new Error(`Geocoding failed: ${status}`));
      }
    });
  });
};

// Places autocomplete service
export const getPlacePredictions = async (input: string): Promise<google.maps.places.AutocompletePrediction[]> => {
  if (!isGoogleMapsLoaded()) {
    throw new Error('Google Maps API not loaded');
  }

  const service = new window.google.maps.places.AutocompleteService();
  
  return new Promise((resolve, reject) => {
    service.getPlacePredictions(
      {
        input,
        types: ['establishment', 'geocode'],
        componentRestrictions: { country: 'us' }
      },
      (predictions: google.maps.places.AutocompletePrediction[], status: google.maps.places.PlacesServiceStatus) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          resolve(predictions || []);
        } else {
          reject(new Error(`Places prediction failed: ${status}`));
        }
      }
    );
  });
};

class PlacesService {
  private apiKey: string;
  private baseUrl = 'https://maps.googleapis.com/maps/api/place';
  
  // Baltimore coordinates for location biasing
  private baltimoreLocation = { lat: 39.2904, lng: -76.6122 };
  private searchRadius = 50000; // 50km radius around Baltimore

  constructor() {
    this.apiKey = process.env.REACT_APP_GOOGLE_PLACES_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Google Places API key not found. Set REACT_APP_GOOGLE_PLACES_API_KEY in your environment.');
    }
  }

  /**
   * Search for businesses in Baltimore area using Google Places Autocomplete
   */
  async searchBusinesses(query: string, sessionToken?: string): Promise<BusinessInfo[]> {
    if (!this.apiKey) {
      throw new Error('Google Places API key not configured');
    }

    if (!query || query.length < 2) {
      return [];
    }

    try {
      const params = new URLSearchParams({
        input: query,
        types: 'establishment',
        location: `${this.baltimoreLocation.lat},${this.baltimoreLocation.lng}`,
        radius: this.searchRadius.toString(),
        components: 'country:us',
        key: this.apiKey,
      });

      if (sessionToken) {
        params.append('sessiontoken', sessionToken);
      }

      const response = await fetch(`${this.baseUrl}/autocomplete/json?${params}`);
      
      if (!response.ok) {
        throw new Error(`Places API request failed: ${response.status}`);
      }

      const data: PlacesAutocompleteResponse = await response.json();

      if (data.status !== 'OK') {
        if (data.status === 'ZERO_RESULTS') {
          return [];
        }
        throw new Error(data.error_message || `Places API error: ${data.status}`);
      }

      // Convert predictions to BusinessInfo objects
      return data.predictions.map(prediction => ({
        placeId: prediction.place_id,
        name: prediction.structured_formatting.main_text,
        address: prediction.structured_formatting.secondary_text || prediction.description,
        types: prediction.types,
        isVerified: true, // Google Places data is considered verified
      }));

    } catch (error) {
      console.error('Error searching businesses:', error);
      throw new Error('Failed to search businesses. Please try again.');
    }
  }

  /**
   * Get detailed information about a specific place
   */
  async getPlaceDetails(placeId: string, sessionToken?: string): Promise<BusinessInfo> {
    if (!this.apiKey) {
      throw new Error('Google Places API key not configured');
    }

    try {
      const params = new URLSearchParams({
        place_id: placeId,
        fields: 'place_id,name,formatted_address,formatted_phone_number,website,business_status,types,geometry',
        key: this.apiKey,
      });

      if (sessionToken) {
        params.append('sessiontoken', sessionToken);
      }

      const response = await fetch(`${this.baseUrl}/details/json?${params}`);
      
      if (!response.ok) {
        throw new Error(`Place Details request failed: ${response.status}`);
      }

      const data: PlaceDetailsResponse = await response.json();

      if (data.status !== 'OK') {
        throw new Error(data.error_message || `Place Details error: ${data.status}`);
      }

      const place = data.result;
      return {
        placeId: place.place_id,
        name: place.name,
        address: place.formatted_address,
        phone: place.formatted_phone_number,
        website: place.website,
        businessStatus: place.business_status,
        types: place.types,
        isVerified: true,
      };

    } catch (error) {
      console.error('Error getting place details:', error);
      throw new Error('Failed to get business details. Please try again.');
    }
  }

  /**
   * Generate a session token for cost optimization
   * Use this for a series of autocomplete requests followed by one place details request
   */
  generateSessionToken(): string {
    // Generate a UUID v4 for session token
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Check if a business is likely in the Baltimore area
   */
  isInBaltimoreArea(businessInfo: BusinessInfo): boolean {
    const baltimoreKeywords = [
      'baltimore', 'md', 'maryland', 'charm city', 'towson', 'dundalk', 
      'catonsville', 'parkville', 'essex', 'glen burnie', 'columbia'
    ];
    
    const searchText = `${businessInfo.name} ${businessInfo.address}`.toLowerCase();
    return baltimoreKeywords.some(keyword => searchText.includes(keyword));
  }
}

// Export singleton instance
export const placesService = new PlacesService();

// Export types
export type { PlacesPrediction, PlaceDetails }; 