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
        Schema::table('branch_variation_availability', function (Blueprint $table) {
            // Branch-specific price (nullable - if null, use default price from item_variations)
            $table->decimal('branch_price', 10, 2)->nullable()->after('is_available');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('branch_variation_availability', function (Blueprint $table) {
            $table->dropColumn('branch_price');
        });
    }
};
