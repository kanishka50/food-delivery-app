<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | SMS Service Configuration
    |--------------------------------------------------------------------------
    |
    | Configure SMS service provider and credentials
    | Supported drivers: 'log', 'notifylk'
    |
    | - 'log': Logs SMS to Laravel log file (for development/testing)
    | - 'notifylk': Notify.lk SMS gateway (for production)
    |
    */

    'sms' => [
        'driver' => env('SMS_DRIVER', 'log'), // 'log' or 'notifylk'
    ],

    'notifylk' => [
        'user_id' => env('NOTIFYLK_USER_ID'),
        'api_key' => env('NOTIFYLK_API_KEY'),
        'sender_id' => env('NOTIFYLK_SENDER_ID', 'NotifyDEMO'), // Use 'NotifyDEMO' for testing only
        'base_url' => env('NOTIFYLK_BASE_URL', 'https://app.notify.lk/api/v1'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Google Services Configuration
    |--------------------------------------------------------------------------
    |
    | Google Maps API for geocoding and location services
    |
    */

    'google' => [
        'maps_api_key' => env('GOOGLE_MAPS_API_KEY'),
    ],

];
