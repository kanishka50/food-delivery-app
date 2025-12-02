<?php

namespace App\Services\SMS;

use Illuminate\Support\Facades\Log;

/**
 * Log SMS Service - For local development and testing
 * Logs SMS to Laravel log file instead of actually sending
 */
class LogSMSService implements SMSInterface
{
    /**
     * Send SMS to a phone number (logs only)
     */
    public function send(string $phoneNumber, string $message): array
    {
        Log::info('📱 SMS (LOG ONLY - NOT SENT)', [
            'to' => $phoneNumber,
            'message' => $message,
            'timestamp' => now()->toDateTimeString(),
        ]);

        // Also output to console if running in CLI
        if (app()->runningInConsole()) {
            echo "\n========================================\n";
            echo "📱 SMS LOG (NOT SENT)\n";
            echo "========================================\n";
            echo "To: {$phoneNumber}\n";
            echo "Message: {$message}\n";
            echo "Time: " . now()->toDateTimeString() . "\n";
            echo "========================================\n\n";
        }

        return [
            'success' => true,
            'message' => 'SMS logged (not sent)',
            'logged' => true,
            'phone' => $phoneNumber,
            'content' => $message,
        ];
    }

    /**
     * Send OTP SMS (logs only)
     */
    public function sendOTP(string $phoneNumber, string $otpCode, string $purpose = 'verification'): array
    {
        $appName = config('app.name', 'Food Delivery');

        $messages = [
            'registration' => "{$otpCode} is your {$appName} verification code. Valid for 5 minutes. Do not share this code.",
            'password_reset' => "{$otpCode} is your {$appName} password reset code. Valid for 5 minutes. Do not share this code.",
            'phone_change' => "{$otpCode} is your {$appName} phone verification code. Valid for 5 minutes. Do not share this code.",
            'login' => "{$otpCode} is your {$appName} login code. Valid for 5 minutes. Do not share this code.",
        ];

        $message = $messages[$purpose] ?? "{$otpCode} is your {$appName} verification code. Valid for 5 minutes.";

        Log::info('📱 OTP SMS (LOG ONLY - NOT SENT)', [
            'to' => $phoneNumber,
            'otp_code' => $otpCode,
            'purpose' => $purpose,
            'message' => $message,
            'timestamp' => now()->toDateTimeString(),
        ]);

        // Output to console with highlighted OTP
        if (app()->runningInConsole()) {
            echo "\n========================================\n";
            echo "🔐 OTP SMS LOG (NOT SENT)\n";
            echo "========================================\n";
            echo "To: {$phoneNumber}\n";
            echo "Purpose: {$purpose}\n";
            echo "OTP CODE: **{$otpCode}**\n";
            echo "Message: {$message}\n";
            echo "Time: " . now()->toDateTimeString() . "\n";
            echo "========================================\n\n";
        }

        return [
            'success' => true,
            'message' => 'OTP SMS logged (not sent)',
            'logged' => true,
            'phone' => $phoneNumber,
            'otp_code' => $otpCode,
            'purpose' => $purpose,
            'content' => $message,
        ];
    }

    /**
     * Log service is always available
     */
    public function isAvailable(): bool
    {
        return true;
    }
}
