<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Services\GeocodingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class GeocodingController extends Controller
{
    protected GeocodingService $geocodingService;

    public function __construct(GeocodingService $geocodingService)
    {
        $this->geocodingService = $geocodingService;
    }

    /**
     * Geocode an address to get latitude and longitude
     *
     * POST /api/geocode/address
     */
    public function geocodeAddress(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'address_line1' => 'required|string',
            'city' => 'required|string',
            'district' => 'required|string',
            'postal_code' => 'nullable|string',
            'country' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $result = $this->geocodingService->geocodeAddress(
            $request->address_line1,
            $request->city,
            $request->district,
            $request->postal_code,
            $request->country ?? 'Sri Lanka'
        );

        if (!$result) {
            return response()->json([
                'success' => false,
                'message' => 'Unable to geocode address. Please check the address details and try again.',
            ], 400);
        }

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    /**
     * Reverse geocode coordinates to get address
     *
     * POST /api/geocode/reverse
     */
    public function reverseGeocode(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $result = $this->geocodingService->reverseGeocode(
            $request->latitude,
            $request->longitude
        );

        if (!$result) {
            return response()->json([
                'success' => false,
                'message' => 'Unable to reverse geocode coordinates.',
            ], 400);
        }

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    /**
     * Validate if address is within delivery radius of any branch
     *
     * POST /api/geocode/validate-address
     */
    public function validateAddress(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'branch_id' => 'nullable|exists:branches,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $lat = $request->latitude;
        $lng = $request->longitude;

        // If specific branch provided, validate against that branch
        if ($request->has('branch_id')) {
            $branch = Branch::find($request->branch_id);

            if (!$branch || !$branch->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Branch not found or inactive',
                ], 404);
            }

            $distance = GeocodingService::calculateDistance(
                $lat,
                $lng,
                $branch->latitude,
                $branch->longitude
            );

            $isValid = $distance <= $branch->delivery_radius_km;

            return response()->json([
                'success' => true,
                'data' => [
                    'is_valid' => $isValid,
                    'branch' => [
                        'id' => $branch->id,
                        'name' => $branch->branch_name,
                        'distance_km' => $distance,
                        'delivery_radius_km' => $branch->delivery_radius_km,
                    ],
                    'delivery_fee' => $this->calculateDeliveryFee($distance),
                ],
            ]);
        }

        // Otherwise, find nearest branch within radius
        $branch = Branch::where('is_active', true)
            ->selectRaw("*,
                (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance",
                [$lat, $lng, $lat]
            )
            ->havingRaw('distance <= delivery_radius_km')
            ->orderBy('distance')
            ->first();

        if (!$branch) {
            return response()->json([
                'success' => false,
                'message' => 'Sorry, we don\'t deliver to this address. No branch found within delivery radius.',
                'data' => [
                    'is_valid' => false,
                ],
            ], 400);
        }

        $distance = round($branch->distance, 2);

        return response()->json([
            'success' => true,
            'data' => [
                'is_valid' => true,
                'branch' => [
                    'id' => $branch->id,
                    'name' => $branch->branch_name,
                    'distance_km' => $distance,
                    'delivery_radius_km' => $branch->delivery_radius_km,
                ],
                'delivery_fee' => $this->calculateDeliveryFee($distance),
            ],
        ]);
    }

    /**
     * Calculate delivery fee based on distance
     *
     * @param float $distance Distance in kilometers
     * @return float
     */
    protected function calculateDeliveryFee(float $distance): float
    {
        // Get delivery rate from system settings (default: LKR 50/km)
        $ratePerKm = 50; // TODO: Fetch from system_settings table

        return round($distance * $ratePerKm, 2);
    }
}
