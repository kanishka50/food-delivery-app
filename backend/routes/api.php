<?php

use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\GeocodingController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\RiderAuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes - No authentication required
Route::prefix('v1')->group(function () {

    // Authentication - OTP Flow
    Route::post('/auth/send-registration-otp', [AuthController::class, 'sendRegistrationOTP']);
    Route::post('/auth/verify-registration-otp', [AuthController::class, 'verifyRegistrationOTP']);
    Route::post('/auth/login', [AuthController::class, 'login']);

    // Password Reset - OTP Flow
    Route::post('/auth/send-password-reset-otp', [AuthController::class, 'sendPasswordResetOTP']);
    Route::post('/auth/verify-password-reset-otp', [AuthController::class, 'verifyPasswordResetOTP']);
    Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);

    // Old registration route (keep for backward compatibility)
    Route::post('/auth/register', [AuthController::class, 'register']);

    // Menu browsing (public)
    Route::get('/categories', [MenuController::class, 'categories']);
    Route::get('/categories/{slug}', [MenuController::class, 'categoryItems']);
    Route::get('/items', [MenuController::class, 'items']);
    Route::get('/items/featured', [MenuController::class, 'featured']);
    Route::get('/items/search', [MenuController::class, 'search']);
    Route::get('/items/{slug}', [MenuController::class, 'itemDetail']);

    // Branches
    Route::get('/branches', [MenuController::class, 'branches']);
    Route::post('/branches/nearest', [MenuController::class, 'nearestBranch']);

    // Cart validation (check item availability at branch before checkout)
    Route::post('/menu/validate-cart', [MenuController::class, 'validateCart']);

    // Geocoding & Location Services (public - used before auth)
    Route::post('/geocode/address', [GeocodingController::class, 'geocodeAddress']);
    Route::post('/geocode/reverse', [GeocodingController::class, 'reverseGeocode']);
    Route::post('/geocode/validate-address', [GeocodingController::class, 'validateAddress']);

    // Protected routes - Authentication required
    Route::middleware('auth:sanctum')->group(function () {

        // Auth
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/profile', [AuthController::class, 'profile']);
        Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
        Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

        // Addresses
        Route::get('/addresses', [AddressController::class, 'index']);
        Route::post('/addresses', [AddressController::class, 'store']);
        Route::get('/addresses/{id}', [AddressController::class, 'show']);
        Route::put('/addresses/{id}', [AddressController::class, 'update']);
        Route::delete('/addresses/{id}', [AddressController::class, 'destroy']);
        Route::post('/addresses/{id}/default', [AddressController::class, 'setDefault']);

        // Cart
        Route::get('/cart', [CartController::class, 'index']);
        Route::post('/cart/items', [CartController::class, 'addItem']);
        Route::put('/cart/items/{itemId}', [CartController::class, 'updateItem']);
        Route::delete('/cart/items/{itemId}', [CartController::class, 'removeItem']);
        Route::delete('/cart', [CartController::class, 'clear']);
        Route::post('/cart/promo-code', [CartController::class, 'applyPromoCode']);
        Route::delete('/cart/promo-code', [CartController::class, 'removePromoCode']);
    });
});

/*
|--------------------------------------------------------------------------
| Rider API Routes
|--------------------------------------------------------------------------
*/
Route::prefix('v1/rider')->group(function () {

    // Public routes - Rider authentication
    Route::post('/login', [RiderAuthController::class, 'login']);

    // Protected routes - Require rider authentication
    Route::middleware('auth:sanctum')->group(function () {

        // Profile management
        Route::get('/profile', [RiderAuthController::class, 'profile']);
        Route::put('/profile', [RiderAuthController::class, 'updateProfile']);
        Route::post('/change-password', [RiderAuthController::class, 'changePassword']);

        // Status management
        Route::post('/toggle-online', [RiderAuthController::class, 'toggleOnline']);
        Route::post('/toggle-availability', [RiderAuthController::class, 'toggleAvailability']);

        // Location tracking
        Route::post('/update-location', [RiderAuthController::class, 'updateLocation']);

        // Logout
        Route::post('/logout', [RiderAuthController::class, 'logout']);
    });
});
