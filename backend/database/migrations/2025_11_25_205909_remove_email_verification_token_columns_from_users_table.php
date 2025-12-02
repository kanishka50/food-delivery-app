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
        Schema::table('users', function (Blueprint $table) {
            // Remove email verification token columns (not needed - using SMS OTP)
            $table->dropColumn([
                'email_verification_token',
                'email_verification_token_expires_at',
                'password_reset_token',
                'password_reset_token_expires_at',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Restore columns if needed (for rollback)
            $table->string('email_verification_token', 64)->nullable()->after('is_phone_verified');
            $table->timestamp('email_verification_token_expires_at')->nullable()->after('email_verification_token');
            $table->string('password_reset_token', 64)->nullable()->after('email_verification_token_expires_at');
            $table->timestamp('password_reset_token_expires_at')->nullable()->after('password_reset_token');
        });
    }
};
