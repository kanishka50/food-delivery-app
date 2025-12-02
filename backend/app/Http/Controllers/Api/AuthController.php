<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\OTPService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    /**
     * Register a new customer
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'username' => 'required|string|max:50|unique:users,username',
            'email' => 'nullable|email|unique:users,email', // Email is now optional
            'phone_number' => 'required|string|max:20|unique:users,phone_number',
            'password' => ['required', 'confirmed', Password::min(8)],
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'terms_accepted' => 'required|accepted',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = User::create([
            'username' => $request->username,
            'email' => $request->email,
            'phone_number' => $request->phone_number,
            'password' => $request->password,
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'user_type' => 'customer',
            'is_active' => true,
            'terms_accepted_at' => now(),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Registration successful',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'email' => $user->email,
                    'phone_number' => $user->phone_number,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'name' => $user->name,
                ],
                'token' => $token,
                'token_type' => 'Bearer',
            ],
        ], 201);
    }

    /**
     * Login customer with phone number or username
     * Email is NOT used for authentication
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'login' => 'required|string', // Can be phone number or username
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $loginField = $request->login;

        // Login with phone number or username ONLY (email not used for auth)
        $user = User::where('user_type', 'customer')
            ->where(function ($query) use ($loginField) {
                $query->where('phone_number', $loginField)
                    ->orWhere('username', $loginField);
            })
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials',
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Your account has been deactivated',
            ], 403);
        }

        // Update last login
        $user->update(['last_login_at' => now()]);

        // Revoke previous tokens (optional - for single device login)
        // $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'email' => $user->email,
                    'phone_number' => $user->phone_number,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'name' => $user->name,
                    'profile_image' => $user->profile_image,
                    'is_phone_verified' => $user->is_phone_verified,
                ],
                'token' => $token,
                'token_type' => 'Bearer',
            ],
        ]);
    }

    /**
     * Logout customer
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * Get authenticated user profile
     */
    public function profile(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'username' => $user->username,
                'email' => $user->email,
                'phone_number' => $user->phone_number,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'name' => $user->name,
                'profile_image' => $user->profile_image,
                'is_phone_verified' => $user->is_phone_verified,
                'created_at' => $user->created_at,
            ],
        ]);
    }

    /**
     * Update user profile
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'first_name' => 'sometimes|string|max:100',
            'last_name' => 'sometimes|string|max:100',
            'email' => 'sometimes|nullable|email|unique:users,email,' . $user->id,
            'profile_image' => 'sometimes|nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Note: Phone number cannot be changed here for security
        // It requires OTP verification (separate endpoint if needed)
        $user->update($request->only(['first_name', 'last_name', 'email', 'profile_image']));

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => [
                'id' => $user->id,
                'username' => $user->username,
                'email' => $user->email,
                'phone_number' => $user->phone_number,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'name' => $user->name,
                'profile_image' => $user->profile_image,
                'is_phone_verified' => $user->is_phone_verified,
            ],
        ]);
    }

    /**
     * Change password
     */
    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect',
            ], 400);
        }

        $user->update(['password' => $request->password]);

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully',
        ]);
    }

    /**
     * Send OTP for registration
     */
    public function sendRegistrationOTP(Request $request, OTPService $otpService)
    {
        $validator = Validator::make($request->all(), [
            'phone_number' => 'required|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Check if phone number already exists
        if (User::where('phone_number', $request->phone_number)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Phone number is already registered',
            ], 400);
        }

        $result = $otpService->sendOTP($request->phone_number, 'registration');

        return response()->json([
            'success' => $result['success'],
            'message' => $result['message'],
            'data' => $result,
        ], $result['success'] ? 200 : 400);
    }

    /**
     * Verify OTP and complete registration
     */
    public function verifyRegistrationOTP(Request $request, OTPService $otpService)
    {
        $validator = Validator::make($request->all(), [
            'phone_number' => 'required|string|max:20',
            'otp_code' => 'required|string|size:6',
            'username' => 'required|string|max:50|unique:users,username',
            'email' => 'nullable|email|unique:users,email',
            'password' => ['required', 'confirmed', Password::min(8)],
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'terms_accepted' => 'required|accepted',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Verify OTP
        $otpResult = $otpService->verifyOTP(
            $request->phone_number,
            $request->otp_code,
            'registration'
        );

        if (!$otpResult['success']) {
            return response()->json($otpResult, 400);
        }

        // Create user account
        $user = User::create([
            'username' => $request->username,
            'email' => $request->email,
            'phone_number' => $request->phone_number,
            'password' => $request->password,
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'user_type' => 'customer',
            'is_phone_verified' => true, // Mark as verified since OTP was verified
            'is_active' => true,
            'terms_accepted_at' => now(),
        ]);

        // Generate token
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Registration successful',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'email' => $user->email,
                    'phone_number' => $user->phone_number,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'name' => $user->name,
                ],
                'token' => $token,
                'token_type' => 'Bearer',
            ],
        ], 201);
    }

    /**
     * Send OTP for password reset
     */
    public function sendPasswordResetOTP(Request $request, OTPService $otpService)
    {
        $validator = Validator::make($request->all(), [
            'phone_number' => 'required|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Check if user exists with this phone number
        $user = User::where('phone_number', $request->phone_number)
            ->where('user_type', 'customer')
            ->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'No account found with this phone number',
            ], 404);
        }

        $result = $otpService->sendOTP($request->phone_number, 'password_reset');

        return response()->json([
            'success' => $result['success'],
            'message' => $result['message'],
            'data' => $result,
        ], $result['success'] ? 200 : 400);
    }

    /**
     * Verify OTP for password reset
     */
    public function verifyPasswordResetOTP(Request $request, OTPService $otpService)
    {
        $validator = Validator::make($request->all(), [
            'phone_number' => 'required|string|max:20',
            'otp_code' => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $result = $otpService->verifyOTP(
            $request->phone_number,
            $request->otp_code,
            'password_reset'
        );

        return response()->json([
            'success' => $result['success'],
            'message' => $result['message'],
            'data' => $result,
        ], $result['success'] ? 200 : 400);
    }

    /**
     * Reset password after OTP verification
     */
    public function resetPassword(Request $request, OTPService $otpService)
    {
        $validator = Validator::make($request->all(), [
            'phone_number' => 'required|string|max:20',
            'otp_code' => 'required|string|size:6',
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Check if OTP was verified (not expired and verified within last 10 minutes)
        $otpVerification = \App\Models\OtpVerification::where('phone_number', $request->phone_number)
            ->where('purpose', 'password_reset')
            ->where('otp_code', $request->otp_code)
            ->where('is_verified', true)
            ->where('verified_at', '>', now()->subMinutes(10))
            ->orderBy('verified_at', 'desc')
            ->first();

        if (!$otpVerification) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired OTP. Please request a new one.',
                'data' => [
                    'success' => false,
                    'message' => 'Invalid or expired OTP. Please request a new one.',
                ],
            ], 400);
        }

        // Find user and update password
        $user = User::where('phone_number', $request->phone_number)
            ->where('user_type', 'customer')
            ->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found',
            ], 404);
        }

        $user->update(['password' => $request->password]);

        // Invalidate all password reset OTPs for this phone number to prevent reuse
        \App\Models\OtpVerification::where('phone_number', $request->phone_number)
            ->where('purpose', 'password_reset')
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Password reset successfully',
            'data' => [
                'success' => true,
                'message' => 'Password reset successfully',
            ],
        ]);
    }
}
