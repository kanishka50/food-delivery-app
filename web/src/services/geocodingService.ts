/**
 * Geocoding Service
 * Handles address geocoding and validation via backend API
 */

import { api } from '@/lib/api';

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formatted_address: string;
  place_id?: string;
  location_type?: string;
}

export interface AddressComponents {
  street_number?: string;
  route?: string;
  locality?: string;
  administrative_area_level_1?: string;
  administrative_area_level_2?: string;
  country?: string;
  postal_code?: string;
}

export interface ReverseGeocodeResult {
  formatted_address: string;
  address_components: AddressComponents;
  place_id?: string;
}

export interface ValidationResult {
  is_valid: boolean;
  branch?: {
    id: number;
    name: string;
    distance_km: number;
    delivery_radius_km: number;
  };
  delivery_fee?: number;
}

/**
 * Geocode an address to get lat/long
 */
export const geocodeAddress = async (
  addressLine1: string,
  city: string,
  district: string,
  postalCode?: string
): Promise<GeocodeResult> => {
  const response = await api.post('/geocode/address', {
    address_line1: addressLine1,
    city,
    district,
    postal_code: postalCode,
    country: 'Sri Lanka',
  });

  return response.data.data;
};

/**
 * Reverse geocode coordinates to get address
 */
export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult> => {
  const response = await api.post('/geocode/reverse', {
    latitude,
    longitude,
  });

  return response.data.data;
};

/**
 * Validate if address is within delivery radius
 */
export const validateAddress = async (
  latitude: number,
  longitude: number,
  branchId?: number
): Promise<ValidationResult> => {
  const response = await api.post('/geocode/validate-address', {
    latitude,
    longitude,
    branch_id: branchId,
  });

  return response.data.data;
};

/**
 * Find nearest branch by coordinates
 */
export const findNearestBranch = async (latitude: number, longitude: number) => {
  const response = await api.post('/branches/nearest', {
    latitude,
    longitude,
  });

  return response.data.data;
};
