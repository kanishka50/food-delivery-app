<?php

namespace App\Services\SMS;

interface SMSInterface
{
    /**
     * Send SMS to a phone number
     *
     * @param string $phoneNumber Phone number in format 94XXXXXXXXX
     * @param string $message SMS message content
     * @return array Response with success status and message
     */
    public function send(string $phoneNumber, string $message): array;

    /**
     * Send OTP SMS
     *
     * @param string $phoneNumber Phone number in format 94XXXXXXXXX
     * @param string $otpCode OTP code (6 digits)
     * @param string $purpose Purpose of OTP (registration, password_reset, etc.)
     * @return array Response with success status and message
     */
    public function sendOTP(string $phoneNumber, string $otpCode, string $purpose = 'verification'): array;

    /**
     * Verify if the service is available and configured
     *
     * @return bool True if service is ready
     */
    public function isAvailable(): bool;
}
