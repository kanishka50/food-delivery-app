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
        Schema::create('branch_variation_availability', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->onDelete('cascade');
            $table->foreignId('variation_id')->constrained('item_variations')->onDelete('cascade');
            $table->boolean('is_available')->default(true);
            $table->timestamps();

            // Ensure unique combination of branch and variation
            $table->unique(['branch_id', 'variation_id'], 'unique_branch_variation');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('branch_variation_availability');
    }
};
