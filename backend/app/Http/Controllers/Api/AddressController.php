<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerAddress;
use App\Services\GeocodingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AddressController extends Controller
{
    protected GeocodingService $geocodingService;

    public function __construct(GeocodingService $geocodingService)
    {
        $this->geocodingService = $geocodingService;
    }

    /**
     * Get all addresses for authenticated user
     */
    public function index(Request $request)
    {
        $addresses = $request->user()
            ->addresses()
            ->orderByDesc('is_default')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $addresses,
        ]);
    }

    /**
     * Create a new address
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'address_label' => 'required|string|max:50',
            'recipient_name' => 'required|string|max:100',
            'phone_number' => 'required|string|max:20',
            'address_line1' => 'required|string|max:255',
            'address_line2' => 'nullable|string|max:255',
            'city' => 'required|string|max:100',
            'district' => 'required|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'delivery_instructions' => 'nullable|string|max:500',
            'is_default' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();

        // If this is set as default, remove default from other addresses
        if ($request->is_default) {
            $user->addresses()->update(['is_default' => false]);
        }

        // If this is the first address, make it default
        $isFirstAddress = $user->addresses()->count() === 0;

        // Auto-geocode address if lat/long not provided
        $latitude = $request->latitude;
        $longitude = $request->longitude;

        if (!$latitude || !$longitude) {
            $geocoded = $this->geocodingService->geocodeAddress(
                $request->address_line1,
                $request->city,
                $request->district,
                $request->postal_code
            );

            if ($geocoded) {
                $latitude = $geocoded['latitude'];
                $longitude = $geocoded['longitude'];
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Unable to geocode address. Please check the address details and try again.',
                ], 400);
            }
        }

        $address = $user->addresses()->create([
            ...$request->only([
                'address_label',
                'recipient_name',
                'phone_number',
                'address_line1',
                'address_line2',
                'city',
                'district',
                'postal_code',
                'delivery_instructions',
            ]),
            'latitude' => $latitude,
            'longitude' => $longitude,
            'is_default' => $request->is_default || $isFirstAddress,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Address created successfully',
            'data' => $address,
        ], 201);
    }

    /**
     * Get a specific address
     */
    public function show(Request $request, $id)
    {
        $address = $request->user()
            ->addresses()
            ->find($id);

        if (!$address) {
            return response()->json([
                'success' => false,
                'message' => 'Address not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $address,
        ]);
    }

    /**
     * Update an address
     */
    public function update(Request $request, $id)
    {
        $address = $request->user()
            ->addresses()
            ->find($id);

        if (!$address) {
            return response()->json([
                'success' => false,
                'message' => 'Address not found',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'address_label' => 'sometimes|string|max:50',
            'recipient_name' => 'sometimes|string|max:100',
            'phone_number' => 'sometimes|string|max:20',
            'address_line1' => 'sometimes|string|max:255',
            'address_line2' => 'nullable|string|max:255',
            'city' => 'sometimes|string|max:100',
            'district' => 'sometimes|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'delivery_instructions' => 'nullable|string|max:500',
            'is_default' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        // If this is set as default, remove default from other addresses
        if ($request->is_default) {
            $request->user()->addresses()
                ->where('id', '!=', $id)
                ->update(['is_default' => false]);
        }

        // Check if address fields changed, re-geocode if needed
        $addressChanged = $request->has('address_line1') ||
            $request->has('city') ||
            $request->has('district') ||
            $request->has('postal_code');

        $updateData = $request->only([
            'address_label',
            'recipient_name',
            'phone_number',
            'address_line1',
            'address_line2',
            'city',
            'district',
            'postal_code',
            'delivery_instructions',
            'is_default',
        ]);

        // Re-geocode if address changed and no lat/long provided
        if ($addressChanged && !$request->has('latitude') && !$request->has('longitude')) {
            $geocoded = $this->geocodingService->geocodeAddress(
                $request->address_line1 ?? $address->address_line1,
                $request->city ?? $address->city,
                $request->district ?? $address->district,
                $request->postal_code ?? $address->postal_code
            );

            if ($geocoded) {
                $updateData['latitude'] = $geocoded['latitude'];
                $updateData['longitude'] = $geocoded['longitude'];
            }
        } elseif ($request->has('latitude') && $request->has('longitude')) {
            $updateData['latitude'] = $request->latitude;
            $updateData['longitude'] = $request->longitude;
        }

        $address->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Address updated successfully',
            'data' => $address->fresh(),
        ]);
    }

    /**
     * Delete an address
     */
    public function destroy(Request $request, $id)
    {
        $address = $request->user()
            ->addresses()
            ->find($id);

        if (!$address) {
            return response()->json([
                'success' => false,
                'message' => 'Address not found',
            ], 404);
        }

        $wasDefault = $address->is_default;
        $address->delete();

        // If deleted address was default, make the most recent one default
        if ($wasDefault) {
            $request->user()
                ->addresses()
                ->orderByDesc('created_at')
                ->first()
                ?->update(['is_default' => true]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Address deleted successfully',
        ]);
    }

    /**
     * Set an address as default
     */
    public function setDefault(Request $request, $id)
    {
        $address = $request->user()
            ->addresses()
            ->find($id);

        if (!$address) {
            return response()->json([
                'success' => false,
                'message' => 'Address not found',
            ], 404);
        }

        // Remove default from all addresses
        $request->user()->addresses()->update(['is_default' => false]);

        // Set this one as default
        $address->update(['is_default' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Default address updated',
            'data' => $address->fresh(),
        ]);
    }
}
