<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('food_items', function (Blueprint $table) {
            // Drop the deprecated base_price column
            // All prices are now stored in item_variations table
            $table->dropColumn('base_price');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('food_items', function (Blueprint $table) {
            // Restore base_price column if rolling back
            $table->decimal('base_price', 10, 2)->nullable()->after('image');
        });
    }
};
