<?php

namespace App\Providers;

use App\Models\ItemVariation;
use App\Observers\ItemVariationObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register observer to auto-update has_variations field
        ItemVariation::observe(ItemVariationObserver::class);
    }
}
