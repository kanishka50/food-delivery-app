<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeocodingService
{
    protected string $apiKey;
    protected string $baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';

    public function __construct()
    {
        $this->apiKey = config('services.google.maps_api_key');
    }

    /**
     * Geocode an address to get latitude and longitude
     *
     * @param string $addressLine1
     * @param string $city
     * @param string $district
     * @param string|null $postalCode
     * @param string $country
     * @return array|null
     */
    public function geocodeAddress(
        string $addressLine1,
        string $city,
        string $district,
        ?string $postalCode = null,
        string $country = 'Sri Lanka'
    ): ?array {
        // Build address string
        $addressParts = [
            $addressLine1,
            $city,
            $district,
        ];

        if ($postalCode) {
            $addressParts[] = $postalCode;
        }

        $addressParts[] = $country;

        $address = implode(', ', array_filter($addressParts));

        try {
            $response = Http::get($this->baseUrl, [
                'address' => $address,
                'key' => $this->apiKey,
            ]);

            $data = $response->json();

            if ($data['status'] === 'OK' && !empty($data['results'])) {
                $result = $data['results'][0];
                $location = $result['geometry']['location'];

                return [
                    'latitude' => $location['lat'],
                    'longitude' => $location['lng'],
                    'formatted_address' => $result['formatted_address'],
                    'place_id' => $result['place_id'] ?? null,
                    'location_type' => $result['geometry']['location_type'] ?? null,
                ];
            }

            // Log geocoding failure
            Log::warning('Geocoding failed', [
                'address' => $address,
                'status' => $data['status'],
                'error_message' => $data['error_message'] ?? null,
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('Geocoding API error', [
                'address' => $address,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Reverse geocode coordinates to get address
     *
     * @param float $latitude
     * @param float $longitude
     * @return array|null
     */
    public function reverseGeocode(float $latitude, float $longitude): ?array
    {
        try {
            $response = Http::get($this->baseUrl, [
                'latlng' => "{$latitude},{$longitude}",
                'key' => $this->apiKey,
            ]);

            $data = $response->json();

            if ($data['status'] === 'OK' && !empty($data['results'])) {
                $result = $data['results'][0];

                // Extract address components
                $addressComponents = $this->extractAddressComponents($result['address_components']);

                return [
                    'formatted_address' => $result['formatted_address'],
                    'address_components' => $addressComponents,
                    'place_id' => $result['place_id'] ?? null,
                ];
            }

            Log::warning('Reverse geocoding failed', [
                'latitude' => $latitude,
                'longitude' => $longitude,
                'status' => $data['status'],
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('Reverse geocoding API error', [
                'latitude' => $latitude,
                'longitude' => $longitude,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Extract useful address components from Google's response
     *
     * @param array $components
     * @return array
     */
    protected function extractAddressComponents(array $components): array
    {
        $extracted = [
            'street_number' => null,
            'route' => null,
            'locality' => null,
            'administrative_area_level_1' => null, // District
            'administrative_area_level_2' => null,
            'country' => null,
            'postal_code' => null,
        ];

        foreach ($components as $component) {
            $types = $component['types'];

            if (in_array('street_number', $types)) {
                $extracted['street_number'] = $component['long_name'];
            }

            if (in_array('route', $types)) {
                $extracted['route'] = $component['long_name'];
            }

            if (in_array('locality', $types)) {
                $extracted['locality'] = $component['long_name'];
            }

            if (in_array('administrative_area_level_1', $types)) {
                $extracted['administrative_area_level_1'] = $component['long_name'];
            }

            if (in_array('administrative_area_level_2', $types)) {
                $extracted['administrative_area_level_2'] = $component['long_name'];
            }

            if (in_array('country', $types)) {
                $extracted['country'] = $component['long_name'];
            }

            if (in_array('postal_code', $types)) {
                $extracted['postal_code'] = $component['long_name'];
            }
        }

        return $extracted;
    }

    /**
     * Calculate distance between two coordinates using Haversine formula
     *
     * @param float $lat1
     * @param float $lon1
     * @param float $lat2
     * @param float $lon2
     * @return float Distance in kilometers
     */
    public static function calculateDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371; // Earth radius in kilometers

        $latDiff = deg2rad($lat2 - $lat1);
        $lonDiff = deg2rad($lon2 - $lon1);

        $a = sin($latDiff / 2) * sin($latDiff / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($lonDiff / 2) * sin($lonDiff / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return round($earthRadius * $c, 2);
    }
}
