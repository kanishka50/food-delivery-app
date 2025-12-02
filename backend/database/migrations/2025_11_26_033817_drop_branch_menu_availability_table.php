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
        // Drop the old branch_menu_availability table
        // This is replaced by branch_variation_availability
        Schema::dropIfExists('branch_menu_availability');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate the old table structure if needed for rollback
        Schema::create('branch_menu_availability', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->onDelete('cascade');
            $table->foreignId('food_item_id')->constrained('food_items')->onDelete('cascade');
            $table->boolean('is_available')->default(true);
            $table->decimal('custom_price', 10, 2)->nullable();
            $table->timestamps();

            $table->unique(['branch_id', 'food_item_id']);
        });
    }
};
