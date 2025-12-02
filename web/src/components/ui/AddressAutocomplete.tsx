'use client';

import { useEffect, useRef, useState } from 'react';
import { useLoadScript } from '@react-google-maps/api';

// Libraries needed for Places Autocomplete
const libraries: ('places')[] = ['places'];

export interface PlaceDetails {
  placeId: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  city: string | null;
  district: string | null;
  country: string | null;
  postalCode: string | null;
}

interface AddressAutocompleteProps {
  onPlaceSelect: (place: PlaceDetails) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  defaultValue?: string;
}

export default function AddressAutocomplete({
  onPlaceSelect,
  placeholder = 'Enter your delivery address...',
  className = '',
  disabled = false,
  defaultValue = '',
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState(defaultValue);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;

    // Initialize autocomplete
    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      // Restrict to Sri Lanka for better results
      componentRestrictions: { country: 'lk' },
      // Request these fields to reduce billing
      fields: ['place_id', 'formatted_address', 'geometry', 'address_components', 'name'],
      // Remove 'types' restriction to show all place types:
      // addresses, establishments, landmarks, buildings, etc.
    });

    // Add listener for place selection
    const listener = autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();

      if (!place || !place.geometry?.location) {
        console.warn('No place details available');
        return;
      }

      // Extract address components
      const addressComponents = place.address_components || [];
      let city: string | null = null;
      let district: string | null = null;
      let country: string | null = null;
      let postalCode: string | null = null;

      for (const component of addressComponents) {
        const types = component.types;

        if (types.includes('locality')) {
          city = component.long_name;
        }
        if (types.includes('administrative_area_level_1')) {
          district = component.long_name;
        }
        if (types.includes('administrative_area_level_2') && !district) {
          district = component.long_name;
        }
        if (types.includes('country')) {
          country = component.long_name;
        }
        if (types.includes('postal_code')) {
          postalCode = component.long_name;
        }
      }

      // Include place name if it's different from the formatted address
      // (useful for establishments like "Pizza Hut, Colombo 03")
      let finalAddress = place.formatted_address || '';
      if (place.name && !finalAddress.toLowerCase().startsWith(place.name.toLowerCase())) {
        finalAddress = `${place.name}, ${finalAddress}`;
      }

      const placeDetails: PlaceDetails = {
        placeId: place.place_id || '',
        formattedAddress: finalAddress,
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
        city,
        district,
        country,
        postalCode,
      };

      // Update input value
      setInputValue(place.formatted_address || '');

      // Call the callback
      onPlaceSelect(placeDetails);
    });

    // Cleanup
    return () => {
      if (listener) {
        google.maps.event.removeListener(listener);
      }
    };
  }, [isLoaded, onPlaceSelect]);

  if (loadError) {
    return (
      <div className="w-full">
        <input
          type="text"
          placeholder="Error loading Google Maps"
          disabled
          className={`w-full px-4 py-3 border border-red-200 rounded-lg bg-red-50 text-red-500 ${className}`}
        />
        <p className="text-xs text-red-500 mt-1">
          Could not load address autocomplete. Please check your API key.
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full">
        <div className={`w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 animate-pulse ${className}`}>
          <div className="h-5 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-4 py-3 pl-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${className}`}
        />
        {/* Search icon */}
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </div>
      <p className="text-xs text-gray-400 mt-1">
        Start typing to see address suggestions
      </p>
    </div>
  );
}
