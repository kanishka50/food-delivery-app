<?php

namespace App\Services;

use App\Models\OtpVerification;
use App\Services\SMS\SMSInterface;
use Illuminate\Support\Facades\Log;

class OTPService
{
    protected SMSInterface $smsService;
    protected int $otpLength = 6;
    protected int $otpValidityMinutes = 5;
    protected int $maxAttempts = 3;
    protected int $resendCooldownSeconds = 60;

    public function __construct(SMSInterface $smsService)
    {
        $this->smsService = $smsService;
    }

    /**
     * Generate and send OTP
     *
     * @param string $phoneNumber Phone number in any format
     * @param string $purpose 'registration', 'password_reset', 'phone_change', 'login'
     * @return array
     */
    public function sendOTP(string $phoneNumber, string $purpose): array
    {
        // Format phone number
        $phoneNumber = $this->formatPhoneNumber($phoneNumber);

        // Check resend cooldown
        if (!$this->canResendOTP($phoneNumber, $purpose)) {
            return [
                'success' => false,
                'message' => 'Please wait before requesting another OTP',
                'wait_seconds' => $this->getRemainingCooldownSeconds($phoneNumber, $purpose),
            ];
        }

        // Invalidate previous OTPs for this phone and purpose
        $this->invalidatePreviousOTPs($phoneNumber, $purpose);

        // Generate OTP code
        $otpCode = $this->generateOTPCode();

        // Save to database
        $otp = OtpVerification::create([
            'phone_number' => $phoneNumber,
            'otp_code' => $otpCode,
            'purpose' => $purpose,
            'is_verified' => false,
            'attempts' => 0,
            'max_attempts' => $this->maxAttempts,
            'expires_at' => now()->addMinutes($this->otpValidityMinutes),
        ]);

        // Send SMS
        $smsResult = $this->smsService->sendOTP($phoneNumber, $otpCode, $purpose);

        if (!$smsResult['success']) {
            Log::error('Failed to send OTP SMS', [
                'phone' => $phoneNumber,
                'purpose' => $purpose,
                'error' => $smsResult,
            ]);

            return [
                'success' => false,
                'message' => 'Failed to send OTP. Please try again.',
            ];
        }

        Log::info('OTP sent successfully', [
            'phone' => $phoneNumber,
            'purpose' => $purpose,
            'otp_id' => $otp->id,
        ]);

        return [
            'success' => true,
            'message' => 'OTP sent successfully',
            'expires_in_seconds' => $this->otpValidityMinutes * 60,
            'can_resend_in_seconds' => $this->resendCooldownSeconds,
        ];
    }

    /**
     * Verify OTP code
     *
     * @param string $phoneNumber
     * @param string $otpCode
     * @param string $purpose
     * @return array
     */
    public function verifyOTP(string $phoneNumber, string $otpCode, string $purpose): array
    {
        $phoneNumber = $this->formatPhoneNumber($phoneNumber);

        // Find the latest unverified OTP
        $otp = OtpVerification::forPhone($phoneNumber, $purpose)
            ->unverified()
            ->first();

        if (!$otp) {
            return [
                'success' => false,
                'message' => 'No OTP found. Please request a new one.',
            ];
        }

        // Check if expired
        if ($otp->isExpired()) {
            return [
                'success' => false,
                'message' => 'OTP has expired. Please request a new one.',
                'expired' => true,
            ];
        }

        // Check if max attempts reached
        if ($otp->hasReachedMaxAttempts()) {
            return [
                'success' => false,
                'message' => 'Maximum verification attempts reached. Please request a new OTP.',
                'max_attempts_reached' => true,
            ];
        }

        // Verify OTP code
        if ($otp->otp_code !== $otpCode) {
            $otp->incrementAttempts();

            $attemptsLeft = $this->maxAttempts - $otp->attempts;

            return [
                'success' => false,
                'message' => "Invalid OTP code. {$attemptsLeft} attempts remaining.",
                'attempts_left' => $attemptsLeft,
            ];
        }

        // OTP is valid - mark as verified
        $otp->markAsVerified();

        Log::info('OTP verified successfully', [
            'phone' => $phoneNumber,
            'purpose' => $purpose,
            'otp_id' => $otp->id,
        ]);

        return [
            'success' => true,
            'message' => 'OTP verified successfully',
            'otp_id' => $otp->id,
        ];
    }

    /**
     * Generate random OTP code
     */
    protected function generateOTPCode(): string
    {
        $min = pow(10, $this->otpLength - 1);
        $max = pow(10, $this->otpLength) - 1;

        return (string) random_int($min, $max);
    }

    /**
     * Format phone number to standard format (94XXXXXXXXX)
     */
    protected function formatPhoneNumber(string $phoneNumber): string
    {
        // Remove all non-numeric characters
        $phoneNumber = preg_replace('/[^0-9]/', '', $phoneNumber);

        // Remove leading zero if present
        if (substr($phoneNumber, 0, 1) === '0') {
            $phoneNumber = substr($phoneNumber, 1);
        }

        // Add country code if not present
        if (substr($phoneNumber, 0, 2) !== '94') {
            $phoneNumber = '94' . $phoneNumber;
        }

        return $phoneNumber;
    }

    /**
     * Check if user can resend OTP (cooldown period)
     */
    protected function canResendOTP(string $phoneNumber, string $purpose): bool
    {
        $latestOTP = OtpVerification::forPhone($phoneNumber, $purpose)->first();

        if (!$latestOTP) {
            return true;
        }

        $timeSinceLastOTP = now()->diffInSeconds($latestOTP->created_at);

        return $timeSinceLastOTP >= $this->resendCooldownSeconds;
    }

    /**
     * Get remaining cooldown seconds
     */
    protected function getRemainingCooldownSeconds(string $phoneNumber, string $purpose): int
    {
        $latestOTP = OtpVerification::forPhone($phoneNumber, $purpose)->first();

        if (!$latestOTP) {
            return 0;
        }

        $timeSinceLastOTP = now()->diffInSeconds($latestOTP->created_at);
        $remaining = $this->resendCooldownSeconds - $timeSinceLastOTP;

        return max(0, $remaining);
    }

    /**
     * Invalidate previous OTPs for phone and purpose
     */
    protected function invalidatePreviousOTPs(string $phoneNumber, string $purpose): void
    {
        OtpVerification::where('phone_number', $phoneNumber)
            ->where('purpose', $purpose)
            ->where('is_verified', false)
            ->update(['is_verified' => true]); // Mark as verified to invalidate
    }

    /**
     * Clean up expired OTPs (can be called via scheduled task)
     */
    public static function cleanupExpiredOTPs(): int
    {
        return OtpVerification::where('expires_at', '<', now()->subDays(7))
            ->delete();
    }
}
