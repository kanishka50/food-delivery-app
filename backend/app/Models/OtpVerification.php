<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OtpVerification extends Model
{
    protected $fillable = [
        'phone_number',
        'otp_code',
        'purpose',
        'is_verified',
        'attempts',
        'max_attempts',
        'expires_at',
        'verified_at',
    ];

    protected $casts = [
        'is_verified' => 'boolean',
        'expires_at' => 'datetime',
        'verified_at' => 'datetime',
    ];

    /**
     * Check if OTP is expired
     */
    public function isExpired(): bool
    {
        return $this->expires_at < now();
    }

    /**
     * Check if max attempts reached
     */
    public function hasReachedMaxAttempts(): bool
    {
        return $this->attempts >= $this->max_attempts;
    }

    /**
     * Increment verification attempts
     */
    public function incrementAttempts(): void
    {
        $this->increment('attempts');
    }

    /**
     * Mark OTP as verified
     */
    public function markAsVerified(): void
    {
        $this->update([
            'is_verified' => true,
            'verified_at' => now(),
        ]);
    }

    /**
     * Scope: Get latest OTP for phone and purpose
     */
    public function scopeForPhone($query, string $phoneNumber, string $purpose)
    {
        return $query->where('phone_number', $phoneNumber)
            ->where('purpose', $purpose)
            ->latest('created_at');
    }

    /**
     * Scope: Get unverified OTPs
     */
    public function scopeUnverified($query)
    {
        return $query->where('is_verified', false);
    }
}
