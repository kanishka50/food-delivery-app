<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemVariation extends Model
{
    protected $table = 'item_variations';

    protected $fillable = [
        'food_item_id',
        'variation_name',
        'price',
        'is_default',
        'is_available',
        'display_order',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'is_default' => 'boolean',
            'is_available' => 'boolean',
            'display_order' => 'integer',
        ];
    }

    public function foodItem()
    {
        return $this->belongsTo(FoodItem::class, 'food_item_id');
    }

    public function scopeAvailable($query)
    {
        return $query->where('is_available', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('display_order', 'asc');
    }

    /**
     * Get all branch availability records for this variation
     */
    public function branchAvailability()
    {
        return $this->hasMany(BranchVariationAvailability::class, 'variation_id');
    }

    /**
     * Get all branches where this variation is available
     */
    public function branches()
    {
        return $this->belongsToMany(Branch::class, 'branch_variation_availability', 'variation_id', 'branch_id')
            ->withPivot('is_available', 'branch_price')
            ->withTimestamps();
    }

    /**
     * Check if this variation is available at a specific branch
     */
    public function isAvailableAtBranch(int $branchId): bool
    {
        return $this->branchAvailability()
            ->where('branch_id', $branchId)
            ->where('is_available', true)
            ->exists();
    }

    /**
     * Get the effective price for this variation at a specific branch
     * Returns branch-specific price if set, otherwise returns default price
     */
    public function getPriceAtBranch(int $branchId): float
    {
        $branchAvailability = $this->branchAvailability()
            ->where('branch_id', $branchId)
            ->first();

        if ($branchAvailability && $branchAvailability->branch_price !== null) {
            return (float) $branchAvailability->branch_price;
        }

        return (float) $this->price;
    }

    /**
     * Get branch availability with price info for a specific branch
     */
    public function getBranchInfo(int $branchId): ?array
    {
        $branchAvailability = $this->branchAvailability()
            ->where('branch_id', $branchId)
            ->first();

        if (!$branchAvailability) {
            return null;
        }

        return [
            'is_available' => $branchAvailability->is_available,
            'price' => $branchAvailability->branch_price ?? $this->price,
            'has_custom_price' => $branchAvailability->branch_price !== null,
        ];
    }
}
