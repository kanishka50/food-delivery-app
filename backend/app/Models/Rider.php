<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class Rider extends Authenticatable
{
    use HasApiTokens, SoftDeletes;

    protected $table = 'riders';

    protected $fillable = [
        'rider_id',
        'full_name',
        'phone_number',
        'password',
        'email',
        'profile_image',
        'vehicle_type',
        'vehicle_number',
        'license_number',
        'is_active',
        'is_available',
        'is_online',
        'current_latitude',
        'current_longitude',
        'last_location_update',
        'assigned_branch_id',
        'average_rating',
        'total_ratings',
        'total_deliveries',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_available' => 'boolean',
            'is_online' => 'boolean',
            'current_latitude' => 'decimal:8',
            'current_longitude' => 'decimal:8',
            'last_location_update' => 'datetime',
            'average_rating' => 'decimal:2',
            'total_ratings' => 'integer',
            'total_deliveries' => 'integer',
            'last_login_at' => 'datetime',
        ];
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($rider) {
            // Auto-generate rider_id if not provided
            if (empty($rider->rider_id)) {
                $rider->rider_id = 'RDR' . str_pad(Rider::max('id') + 1, 6, '0', STR_PAD_LEFT);
            }
        });
    }

    /**
     * Get the branch this rider is assigned to
     */
    public function assignedBranch()
    {
        return $this->belongsTo(Branch::class, 'assigned_branch_id');
    }

    /**
     * Get all orders assigned to this rider
     */
    public function orders()
    {
        return $this->hasMany(Order::class, 'rider_id');
    }

    /**
     * Get rider's reviews
     */
    public function reviews()
    {
        return $this->hasMany(RiderReview::class, 'rider_id');
    }

    /**
     * Get rider's location history
     */
    public function locationHistory()
    {
        return $this->hasMany(RiderLocationHistory::class, 'rider_id');
    }

    /**
     * Get rider's daily earnings
     */
    public function dailyEarnings()
    {
        return $this->hasMany(RiderDailyEarning::class, 'rider_id');
    }

    /**
     * Scope: Active riders only
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: Online riders only
     */
    public function scopeOnline($query)
    {
        return $query->where('is_online', true);
    }

    /**
     * Scope: Available riders only
     */
    public function scopeAvailable($query)
    {
        return $query->where('is_available', true)->where('is_online', true);
    }
}
