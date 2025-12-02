import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

export interface DeliveryLocation {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  district?: string;
  placeId?: string; // Google Places ID for reference
  source: 'gps' | 'manual' | 'places' | 'saved_address';
  timestamp: string;
}

export interface SelectedBranch {
  id: number;
  branch_code: string;
  branch_name: string;
  slug: string;
  address: string;
  city: string;
  distance_km: number;
  delivery_radius_km: number;
  is_open_now: boolean;
  can_deliver: boolean;
}

interface LocationState {
  // Delivery location (where customer wants food delivered)
  deliveryLocation: DeliveryLocation | null;

  // Selected/nearest branch for the delivery location
  selectedBranch: SelectedBranch | null;

  // Whether user has seen and interacted with location prompt
  hasPromptedLocation: boolean;

  // Loading states
  isLoadingLocation: boolean;
  isLoadingBranch: boolean;

  // Error state
  error: string | null;

  // Actions
  setDeliveryLocation: (location: DeliveryLocation) => Promise<void>;
  setDeliveryLocationFromGPS: () => Promise<void>;
  setDeliveryLocationManually: (address: string, city: string, district: string) => Promise<void>;
  setDeliveryLocationFromPlaces: (placeDetails: {
    placeId: string;
    formattedAddress: string;
    latitude: number;
    longitude: number;
    city: string | null;
    district: string | null;
  }) => Promise<void>;
  clearDeliveryLocation: () => void;
  setHasPromptedLocation: (value: boolean) => void;
  findNearestBranch: (lat: number, lng: number) => Promise<SelectedBranch | null>;
  clearError: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      deliveryLocation: null,
      selectedBranch: null,
      hasPromptedLocation: false,
      isLoadingLocation: false,
      isLoadingBranch: false,
      error: null,

      setDeliveryLocation: async (location: DeliveryLocation) => {
        set({ deliveryLocation: location, isLoadingBranch: true, error: null });

        try {
          // Find nearest branch for this location
          const branch = await get().findNearestBranch(location.latitude, location.longitude);
          set({ selectedBranch: branch, isLoadingBranch: false });
        } catch (error) {
          set({
            error: 'Could not find a branch for delivery to this location',
            isLoadingBranch: false,
          });
        }
      },

      setDeliveryLocationFromGPS: async () => {
        set({ isLoadingLocation: true, error: null });

        try {
          // Check if geolocation is supported
          if (!('geolocation' in navigator)) {
            throw new Error('Geolocation is not supported by your browser');
          }

          // Get current position
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 300000,
            });
          });

          const { latitude, longitude } = position.coords;

          // Try to reverse geocode to get address
          let address = '';
          let city = '';
          let district = '';

          try {
            const response = await api.post('/geocode/reverse', { latitude, longitude });
            const data = response.data.data;
            address = data.formatted_address || '';
            city = data.address_components?.locality || '';
            district = data.address_components?.administrative_area_level_2 || '';
          } catch {
            // Geocoding failed, but we still have coordinates
            console.warn('Reverse geocoding failed');
          }

          const location: DeliveryLocation = {
            latitude,
            longitude,
            address,
            city,
            district,
            source: 'gps',
            timestamp: new Date().toISOString(),
          };

          set({ isLoadingLocation: false });
          await get().setDeliveryLocation(location);
        } catch (error) {
          const err = error as GeolocationPositionError | Error;
          let message = 'Failed to get your location';

          if ('code' in err) {
            switch (err.code) {
              case 1:
                message = 'Location permission denied. Please enable location access.';
                break;
              case 2:
                message = 'Location unavailable. Please try again.';
                break;
              case 3:
                message = 'Location request timed out. Please try again.';
                break;
            }
          }

          set({ error: message, isLoadingLocation: false });
        }
      },

      setDeliveryLocationManually: async (address: string, city: string, district: string) => {
        set({ isLoadingLocation: true, error: null });

        try {
          // Geocode the address to get coordinates
          const response = await api.post('/geocode/address', {
            address_line1: address,
            city,
            district,
            country: 'Sri Lanka',
          });

          const data = response.data.data;

          const location: DeliveryLocation = {
            latitude: data.latitude,
            longitude: data.longitude,
            address: data.formatted_address || address,
            city,
            district,
            source: 'manual',
            timestamp: new Date().toISOString(),
          };

          set({ isLoadingLocation: false });
          await get().setDeliveryLocation(location);
        } catch (error) {
          set({
            error: 'Could not find this address. Please check and try again.',
            isLoadingLocation: false,
          });
        }
      },

      setDeliveryLocationFromPlaces: async (placeDetails) => {
        set({ isLoadingLocation: true, error: null });

        try {
          const location: DeliveryLocation = {
            latitude: placeDetails.latitude,
            longitude: placeDetails.longitude,
            address: placeDetails.formattedAddress,
            city: placeDetails.city || undefined,
            district: placeDetails.district || undefined,
            placeId: placeDetails.placeId,
            source: 'places',
            timestamp: new Date().toISOString(),
          };

          set({ isLoadingLocation: false });
          await get().setDeliveryLocation(location);
        } catch (error) {
          set({
            error: 'Could not set this location. Please try again.',
            isLoadingLocation: false,
          });
        }
      },

      clearDeliveryLocation: () => {
        set({
          deliveryLocation: null,
          selectedBranch: null,
          error: null,
        });
      },

      setHasPromptedLocation: (value: boolean) => {
        set({ hasPromptedLocation: value });
      },

      findNearestBranch: async (lat: number, lng: number): Promise<SelectedBranch | null> => {
        try {
          const response = await api.post('/branches/nearest', {
            latitude: lat,
            longitude: lng,
          });

          const data = response.data.data;

          return {
            id: data.id,
            branch_code: data.branch_code,
            branch_name: data.branch_name,
            slug: data.slug,
            address: data.address,
            city: data.city,
            distance_km: data.distance_km,
            delivery_radius_km: data.delivery_radius_km,
            is_open_now: data.is_open_now,
            can_deliver: data.is_within_radius,
          };
        } catch {
          return null;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'delivery-location-storage',
      partialize: (state) => ({
        deliveryLocation: state.deliveryLocation,
        selectedBranch: state.selectedBranch,
        hasPromptedLocation: state.hasPromptedLocation,
      }),
    }
  )
);
