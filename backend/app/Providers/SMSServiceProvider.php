<?php

namespace App\Providers;

use App\Services\SMS\LogSMSService;
use App\Services\SMS\NotifyLKService;
use App\Services\SMS\SMSInterface;
use Illuminate\Support\ServiceProvider;

class SMSServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->bind(SMSInterface::class, function ($app) {
            $driver = config('services.sms.driver', 'log');

            return match ($driver) {
                'notifylk' => new NotifyLKService(),
                'log' => new LogSMSService(),
                default => new LogSMSService(), // Fallback to log
            };
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
