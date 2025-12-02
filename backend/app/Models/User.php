<?php

namespace App\Models;

use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements FilamentUser
{
    use HasFactory, Notifiable, SoftDeletes, HasApiTokens;

    protected $fillable = [
        'username',
        'email',
        'phone_number',
        'password',
        'user_type',
        'admin_role_id',
        'first_name',
        'last_name',
        'profile_image',
        'is_phone_verified',
        'is_active',
        'terms_accepted_at',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'is_phone_verified' => 'boolean',
            'is_active' => 'boolean',
            'terms_accepted_at' => 'datetime',
            'last_login_at' => 'datetime',
        ];
    }

    /**
     * Determine if the user can access the Filament admin panel.
     */
    public function canAccessPanel(Panel $panel): bool
    {
        return $this->user_type === 'admin' && $this->is_active;
    }

    /**
     * Get the admin role for this user.
     */
    public function adminRole()
    {
        return $this->belongsTo(AdminRole::class, 'admin_role_id');
    }

    /**
     * Get the customer addresses for this user.
     */
    public function addresses()
    {
        return $this->hasMany(CustomerAddress::class);
    }

    /**
     * Get orders for this user.
     */
    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Get cart for this user.
     */
    public function cart()
    {
        return $this->hasOne(Cart::class);
    }

    /**
     * Check if user is admin.
     */
    public function isAdmin(): bool
    {
        return $this->user_type === 'admin';
    }

    /**
     * Check if user is customer.
     */
    public function isCustomer(): bool
    {
        return $this->user_type === 'customer';
    }

    /**
     * Get full name attribute.
     */
    public function getNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}") ?: $this->username;
    }
}
