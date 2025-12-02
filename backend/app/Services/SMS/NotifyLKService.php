<?php

namespace App\Services\SMS;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NotifyLKService implements SMSInterface
{
    protected string $userId;
    protected string $apiKey;
    protected string $senderId;
    protected string $baseUrl;

    public function __construct()
    {
        $this->userId = config('services.notifylk.user_id');
        $this->apiKey = config('services.notifylk.api_key');
        $this->senderId = config('services.notifylk.sender_id');
        $this->baseUrl = config('services.notifylk.base_url', 'https://app.notify.lk/api/v1');
    }

    /**
     * Send SMS to a phone number
     */
    public function send(string $phoneNumber, string $message): array
    {
        try {
            $response = Http::timeout(10)->get($this->baseUrl . '/send', [
                'user_id' => $this->userId,
                'api_key' => $this->apiKey,
                'sender_id' => $this->senderId,
                'to' => $this->formatPhoneNumber($phoneNumber),
                'message' => $message,
            ]);

            if ($response->successful()) {
                Log::info('SMS sent via Notify.lk', [
                    'phone' => $phoneNumber,
                    'status' => 'success',
                ]);

                return [
                    'success' => true,
                    'message' => 'SMS sent successfully',
                    'response' => $response->json(),
                ];
            }

            Log::error('Failed to send SMS via Notify.lk', [
                'phone' => $phoneNumber,
                'status' => $response->status(),
                'response' => $response->body(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to send SMS',
                'error' => $response->body(),
            ];
        } catch (\Exception $e) {
            Log::error('SMS send exception', [
                'phone' => $phoneNumber,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'SMS service error',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Send OTP SMS
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

        return $this->send($phoneNumber, $message);
    }

    /**
     * Format phone number for Notify.lk
     * Accepts: +94771234567, 94771234567, 0771234567, 771234567
     * Returns: 94771234567
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
     * Verify if the service is available and configured
     */
    public function isAvailable(): bool
    {
        return !empty($this->userId) && !empty($this->apiKey) && !empty($this->senderId);
    }
}
