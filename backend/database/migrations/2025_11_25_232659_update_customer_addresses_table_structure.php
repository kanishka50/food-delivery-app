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
        Schema::table('customer_addresses', function (Blueprint $table) {
            // Add missing columns
            $table->string('recipient_name', 100)->after('address_label');
            $table->string('phone_number', 20)->after('recipient_name');

            // Rename columns to match API naming convention
            $table->renameColumn('address_line_1', 'address_line1');
            $table->renameColumn('address_line_2', 'address_line2');
            $table->renameColumn('special_instructions', 'delivery_instructions');

            // Make latitude and longitude nullable (will be populated by geocoding service later)
            $table->decimal('latitude', 10, 8)->nullable()->change();
            $table->decimal('longitude', 11, 8)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customer_addresses', function (Blueprint $table) {
            // Remove added columns
            $table->dropColumn(['recipient_name', 'phone_number']);

            // Rename columns back
            $table->renameColumn('address_line1', 'address_line_1');
            $table->renameColumn('address_line2', 'address_line_2');
            $table->renameColumn('delivery_instructions', 'special_instructions');

            // Make latitude and longitude not nullable
            $table->decimal('latitude', 10, 8)->nullable(false)->change();
            $table->decimal('longitude', 11, 8)->nullable(false)->change();
        });
    }
};
