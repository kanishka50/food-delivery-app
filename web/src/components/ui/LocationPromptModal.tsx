'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocationStore } from '@/store/locationStore';
import AddressAutocomplete, { PlaceDetails } from './AddressAutocomplete';

interface LocationPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSkip?: () => void;
}

export default function LocationPromptModal({
  isOpen,
  onClose,
  onSkip,
}: LocationPromptModalProps) {
  const {
    setDeliveryLocationFromGPS,
    setDeliveryLocationFromPlaces,
    setHasPromptedLocation,
    clearDeliveryLocation,
    isLoadingLocation,
    isLoadingBranch,
    selectedBranch,
    deliveryLocation,
    error,
    clearError,
  } = useLocationStore();

  const [showManualEntry, setShowManualEntry] = useState(false);
  const [localError, setLocalError] = useState('');
  const [isChangingLocation, setIsChangingLocation] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setShowManualEntry(false);
      setLocalError('');
      clearError();
      // If there's already a location set, show it (but allow changing)
      setIsChangingLocation(false);
    }
  }, [isOpen, clearError]);

  // Handle place selection from autocomplete
  const handlePlaceSelect = useCallback(async (place: PlaceDetails) => {
    clearError();
    setLocalError('');
    await setDeliveryLocationFromPlaces({
      placeId: place.placeId,
      formattedAddress: place.formattedAddress,
      latitude: place.latitude,
      longitude: place.longitude,
      city: place.city,
      district: place.district,
    });
  }, [setDeliveryLocationFromPlaces, clearError]);

  if (!isOpen) return null;

  // Determine if we're showing existing location or getting new one
  const hasExistingLocation = deliveryLocation && selectedBranch && !isChangingLocation;

  const handleUseCurrentLocation = async () => {
    clearError();
    setLocalError('');
    await setDeliveryLocationFromGPS();
  };

  const handleSkip = () => {
    setHasPromptedLocation(true);
    onSkip?.();
    onClose();
  };

  const handleConfirmLocation = () => {
    setHasPromptedLocation(true);
    onClose();
  };

  const handleChangeLocation = () => {
    clearDeliveryLocation();
    setIsChangingLocation(true);
    setShowManualEntry(false);
  };

  const handleClearAndClose = () => {
    clearDeliveryLocation();
    setHasPromptedLocation(true);
    onClose();
  };

  const isLoading = isLoadingLocation || isLoadingBranch;
  const displayError = error || localError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-8 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8"
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
          <h2 className="text-2xl font-bold mb-2">Set Your Delivery Location</h2>
          <p className="text-orange-100">
            Help us find the nearest branch and show you accurate prices
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Show existing location with options to keep or change */}
          {hasExistingLocation && (
            <div className="mb-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-green-800">
                      Current Delivery Location
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      {deliveryLocation.address || deliveryLocation.city || 'Your location'}
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      Branch: {selectedBranch.branch_name} ({selectedBranch.distance_km} km)
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleConfirmLocation}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition"
                >
                  Keep this location
                </button>
                <button
                  onClick={handleChangeLocation}
                  className="w-full border-2 border-orange-500 text-orange-500 py-3 rounded-lg font-medium hover:bg-orange-50 transition"
                >
                  Change location
                </button>
                <button
                  onClick={handleClearAndClose}
                  className="w-full text-gray-500 hover:text-gray-700 py-2 text-sm"
                >
                  Clear location (browse without location)
                </button>
              </div>
            </div>
          )}

          {/* Show selected branch if just found (during this session) */}
          {!hasExistingLocation && selectedBranch && !isChangingLocation && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-green-800">
                    Nearest Branch Found!
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    {selectedBranch.branch_name} ({selectedBranch.distance_km} km away)
                  </p>
                  {selectedBranch.can_deliver ? (
                    <p className="text-xs text-green-600 mt-1">
                      Delivery available to your location
                    </p>
                  ) : (
                    <p className="text-xs text-orange-600 mt-1">
                      Outside delivery radius - some restrictions may apply
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleConfirmLocation}
                className="w-full mt-4 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition"
              >
                Continue with this location
              </button>
            </div>
          )}

          {/* Error message */}
          {displayError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {displayError}
            </div>
          )}

          {(!selectedBranch || isChangingLocation) && !hasExistingLocation && (
            <>
              {/* Use Current Location Button */}
              {!showManualEntry && (
                <button
                  onClick={handleUseCurrentLocation}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 bg-orange-500 text-white py-4 rounded-xl font-medium hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>Getting your location...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>Use My Current Location</span>
                    </>
                  )}
                </button>
              )}

              {/* Divider */}
              {!showManualEntry && (
                <div className="flex items-center gap-4 my-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-sm text-gray-500">or</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
              )}

              {/* Address Search with Autocomplete */}
              {!showManualEntry ? (
                <button
                  onClick={() => setShowManualEntry(true)}
                  className="w-full flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-700 py-4 rounded-xl font-medium hover:border-gray-300 hover:bg-gray-50 transition"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <span>Search for Address</span>
                </button>
              ) : (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setShowManualEntry(false)}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Back to options
                  </button>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter your delivery address
                    </label>
                    <AddressAutocomplete
                      onPlaceSelect={handlePlaceSelect}
                      placeholder="Search for your address..."
                      disabled={isLoading}
                    />
                  </div>

                  {isLoading && (
                    <div className="flex items-center justify-center gap-2 text-orange-500">
                      <svg
                        className="animate-spin h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>Finding nearest branch...</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          {!hasExistingLocation && (
            <>
              <button
                onClick={handleSkip}
                className="w-full text-center text-gray-500 hover:text-gray-700 text-sm py-2"
              >
                Skip for now - I&apos;ll browse without location
              </button>
              <p className="text-xs text-gray-400 text-center mt-2">
                You can set your location anytime from the header
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
