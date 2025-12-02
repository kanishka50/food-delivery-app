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
        Schema::table('orders', function (Blueprint $table) {
            // Make delivery_address_id nullable
            // This allows orders to use delivery_address_snapshot JSON for temporary addresses
            // or reference customer_addresses table for saved addresses
            $table->bigInteger('delivery_address_id')->unsigned()->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Revert to NOT NULL (only if needed)
            $table->bigInteger('delivery_address_id')->unsigned()->nullable(false)->change();
        });
    }
};
