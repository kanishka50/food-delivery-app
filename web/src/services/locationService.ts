/**
 * Location Service
 * Handles GPS location tracking using browser Geolocation API
 * Stores location in sessionStorage (temporary, cleared on tab close)
 */

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
}

const STORAGE_KEY = 'userLocation';

/**
 * Request location permission from user
 * @returns Promise<boolean> - true if permission granted
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  if (!('geolocation' in navigator)) {
    console.error('Geolocation is not supported by this browser');
    return false;
  }

  try {
    // Try to get current position to trigger permission request
    await getCurrentLocation();
    return true;
  } catch (error) {
    console.error('Location permission denied:', error);
    return false;
  }
};

/**
 * Get current GPS location from browser
 * @returns Promise<Location>
 */
export const getCurrentLocation = (): Promise<Location> => {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(),
        };

        // Store in sessionStorage
        storeLocation(location);

        resolve(location);
      },
      (error) => {
        let errorMessage = 'Unknown error occurred';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }

        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds
        maximumAge: 300000, // 5 minutes
      }
    );
  });
};

/**
 * Store location in sessionStorage
 * @param location Location object
 */
export const storeLocation = (location: Location): void => {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(location));
  } catch (error) {
    console.error('Failed to store location:', error);
  }
};

/**
 * Get location from sessionStorage
 * @returns Location | null
 */
export const getStoredLocation = (): Location | null => {
  if (typeof window === 'undefined') return null;

  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const location = JSON.parse(stored) as Location;

    // Check if location is still fresh (less than 30 minutes old)
    const timestamp = new Date(location.timestamp);
    const now = new Date();
    const diffMinutes = (now.getTime() - timestamp.getTime()) / (1000 * 60);

    if (diffMinutes > 30) {
      // Location is stale, remove it
      clearStoredLocation();
      return null;
    }

    return location;
  } catch (error) {
    console.error('Failed to get stored location:', error);
    return null;
  }
};

/**
 * Clear stored location from sessionStorage
 */
export const clearStoredLocation = (): void => {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear stored location:', error);
  }
};

/**
 * Get location (from storage or fresh from GPS)
 * @param forceRefresh Force getting fresh location
 * @returns Promise<Location>
 */
export const getLocation = async (forceRefresh = false): Promise<Location> => {
  if (!forceRefresh) {
    const stored = getStoredLocation();
    if (stored) {
      return stored;
    }
  }

  return getCurrentLocation();
};

/**
 * Watch location changes (continuous tracking)
 * @param callback Function to call when location changes
 * @returns watchId to clear the watch later
 */
export const watchLocation = (
  callback: (location: Location) => void
): number | null => {
  if (!('geolocation' in navigator)) {
    console.error('Geolocation is not supported');
    return null;
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const location: Location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date().toISOString(),
      };

      storeLocation(location);
      callback(location);
    },
    (error) => {
      console.error('Watch location error:', error);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000, // 1 minute
    }
  );

  return watchId;
};

/**
 * Stop watching location
 * @param watchId The ID returned by watchLocation
 */
export const clearWatch = (watchId: number): void => {
  if ('geolocation' in navigator) {
    navigator.geolocation.clearWatch(watchId);
  }
};
