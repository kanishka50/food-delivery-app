<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class RiderAuthController extends Controller
{
    /**
     * Rider Login with Phone + Password
     * POST /api/rider/login
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'phone_number' => 'required|string',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Find rider by phone number
        $rider = Rider::where('phone_number', $request->phone_number)->first();

        if (!$rider) {
            return response()->json([
                'success' => false,
                'message' => 'Rider not found. Please contact admin.',
            ], 404);
        }

        // Check if rider is active
        if (!$rider->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Your account is deactivated. Please contact admin.',
            ], 403);
        }

        // Verify password
        if (!Hash::check($request->password, $rider->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials',
            ], 401);
        }

        // Update last login and set online status
        $rider->update([
            'last_login_at' => now(),
            'is_online' => true,
        ]);

        // Generate API token
        $token = $rider->createToken('rider-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'token' => $token,
                'rider' => [
                    'id' => $rider->id,
                    'rider_id' => $rider->rider_id,
                    'full_name' => $rider->full_name,
                    'phone_number' => $rider->phone_number,
                    'email' => $rider->email,
                    'profile_image' => $rider->profile_image,
                    'vehicle_type' => $rider->vehicle_type,
                    'vehicle_number' => $rider->vehicle_number,
                    'is_available' => $rider->is_available,
                    'is_online' => $rider->is_online,
                    'assigned_branch' => $rider->assignedBranch ? [
                        'id' => $rider->assignedBranch->id,
                        'name' => $rider->assignedBranch->branch_name,
                    ] : null,
                    'average_rating' => (float) $rider->average_rating,
                    'total_deliveries' => $rider->total_deliveries,
                ],
            ],
        ]);
    }

    /**
     * Get Rider Profile
     * GET /api/rider/profile
     */
    public function profile(Request $request)
    {
        $rider = $request->user();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $rider->id,
                'rider_id' => $rider->rider_id,
                'full_name' => $rider->full_name,
                'phone_number' => $rider->phone_number,
                'email' => $rider->email,
                'profile_image' => $rider->profile_image,
                'vehicle_type' => $rider->vehicle_type,
                'vehicle_number' => $rider->vehicle_number,
                'license_number' => $rider->license_number,
                'is_active' => $rider->is_active,
                'is_available' => $rider->is_available,
                'is_online' => $rider->is_online,
                'assigned_branch' => $rider->assignedBranch ? [
                    'id' => $rider->assignedBranch->id,
                    'name' => $rider->assignedBranch->branch_name,
                    'address' => $rider->assignedBranch->address,
                    'phone' => $rider->assignedBranch->contact_number,
                ] : null,
                'current_latitude' => $rider->current_latitude,
                'current_longitude' => $rider->current_longitude,
                'average_rating' => (float) $rider->average_rating,
                'total_ratings' => $rider->total_ratings,
                'total_deliveries' => $rider->total_deliveries,
                'last_login_at' => $rider->last_login_at,
            ],
        ]);
    }

    /**
     * Update Rider Profile
     * PUT /api/rider/profile
     */
    public function updateProfile(Request $request)
    {
        $rider = $request->user();

        $validator = Validator::make($request->all(), [
            'full_name' => 'sometimes|string|max:150',
            'email' => 'sometimes|email|max:255',
            'profile_image' => 'sometimes|image|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $updateData = $request->only(['full_name', 'email']);

        // Handle profile image upload
        if ($request->hasFile('profile_image')) {
            $path = $request->file('profile_image')->store('riders', 'public');
            $updateData['profile_image'] = $path;
        }

        $rider->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => [
                'full_name' => $rider->full_name,
                'email' => $rider->email,
                'profile_image' => $rider->profile_image,
            ],
        ]);
    }

    /**
     * Change Password
     * POST /api/rider/change-password
     */
    public function changePassword(Request $request)
    {
        $rider = $request->user();

        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Verify current password
        if (!Hash::check($request->current_password, $rider->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect',
            ], 401);
        }

        // Update password
        $rider->update([
            'password' => Hash::make($request->new_password),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully',
        ]);
    }

    /**
     * Toggle Online/Offline Status
     * POST /api/rider/toggle-online
     */
    public function toggleOnline(Request $request)
    {
        $rider = $request->user();

        $newStatus = !$rider->is_online;

        $rider->update([
            'is_online' => $newStatus,
            'is_available' => $newStatus ? $rider->is_available : false, // Set unavailable when going offline
        ]);

        return response()->json([
            'success' => true,
            'message' => $newStatus ? 'You are now online' : 'You are now offline',
            'data' => [
                'is_online' => $rider->is_online,
                'is_available' => $rider->is_available,
            ],
        ]);
    }

    /**
     * Toggle Available/Unavailable Status
     * POST /api/rider/toggle-availability
     */
    public function toggleAvailability(Request $request)
    {
        $rider = $request->user();

        if (!$rider->is_online) {
            return response()->json([
                'success' => false,
                'message' => 'You must be online to change availability',
            ], 400);
        }

        $newStatus = !$rider->is_available;

        $rider->update([
            'is_available' => $newStatus,
        ]);

        return response()->json([
            'success' => true,
            'message' => $newStatus ? 'You are now available for orders' : 'You are now unavailable for orders',
            'data' => [
                'is_available' => $rider->is_available,
            ],
        ]);
    }

    /**
     * Update Rider Location
     * POST /api/rider/update-location
     */
    public function updateLocation(Request $request)
    {
        $rider = $request->user();

        $validator = Validator::make($request->all(), [
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $rider->update([
            'current_latitude' => $request->latitude,
            'current_longitude' => $request->longitude,
            'last_location_update' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Location updated successfully',
            'data' => [
                'latitude' => (float) $rider->current_latitude,
                'longitude' => (float) $rider->current_longitude,
                'last_update' => $rider->last_location_update,
            ],
        ]);
    }

    /**
     * Logout
     * POST /api/rider/logout
     */
    public function logout(Request $request)
    {
        $rider = $request->user();

        // Set rider offline
        $rider->update([
            'is_online' => false,
            'is_available' => false,
        ]);

        // Revoke current access token
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ]);
    }
}
