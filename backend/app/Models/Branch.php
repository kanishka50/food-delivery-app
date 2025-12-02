<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Branch extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'branch_name',
        'branch_code',
        'branch_slug',
        'address',
        'city',
        'district',
        'latitude',
        'longitude',
        'delivery_radius_km',
        'contact_number',
        'email',
        'opening_time',
        'closing_time',
        'is_open_sunday',
        'is_open_monday',
        'is_open_tuesday',
        'is_open_wednesday',
        'is_open_thursday',
        'is_open_friday',
        'is_open_saturday',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:8',
            'longitude' => 'decimal:8',
            'delivery_radius_km' => 'decimal:2',
            'opening_time' => 'datetime:H:i',
            'closing_time' => 'datetime:H:i',
            'is_open_sunday' => 'boolean',
            'is_open_monday' => 'boolean',
            'is_open_tuesday' => 'boolean',
            'is_open_wednesday' => 'boolean',
            'is_open_thursday' => 'boolean',
            'is_open_friday' => 'boolean',
            'is_open_saturday' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($branch) {
            if (empty($branch->branch_slug)) {
                $branch->branch_slug = Str::slug($branch->branch_name);
            }
            if (empty($branch->branch_code)) {
                $lastBranch = self::withTrashed()->orderBy('id', 'desc')->first();
                $nextId = $lastBranch ? $lastBranch->id + 1 : 1;
                $branch->branch_code = 'BR' . str_pad($nextId, 3, '0', STR_PAD_LEFT);
            }
        });
    }

    public function riders()
    {
        return $this->hasMany(Rider::class, 'assigned_branch_id');
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function menuAvailability()
    {
        return $this->hasMany(BranchMenuAvailability::class);
    }

    public function availableFoodItems()
    {
        return $this->belongsToMany(FoodItem::class, 'branch_menu_availability')
            ->withPivot('is_available', 'custom_price')
            ->withTimestamps();
    }

    public function isOpenToday(): bool
    {
        $day = strtolower(now()->format('l'));
        return $this->{"is_open_{$day}"} ?? false;
    }

    public function isCurrentlyOpen(): bool
    {
        if (!$this->isOpenToday()) {
            return false;
        }

        $now = now()->format('H:i:s');
        return $now >= $this->opening_time && $now <= $this->closing_time;
    }

    /**
     * Get all variation availability records for this branch
     */
    public function variationAvailability()
    {
        return $this->hasMany(BranchVariationAvailability::class);
    }

    /**
     * Get all available variations at this branch
     */
    public function availableVariations()
    {
        return $this->belongsToMany(ItemVariation::class, 'branch_variation_availability', 'branch_id', 'variation_id')
            ->withPivot('is_available')
            ->wherePivot('is_available', true)
            ->withTimestamps();
    }
}
