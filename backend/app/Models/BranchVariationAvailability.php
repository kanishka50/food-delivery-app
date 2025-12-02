<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BranchVariationAvailability extends Model
{
    protected $table = 'branch_variation_availability';

    protected $fillable = [
        'branch_id',
        'variation_id',
        'is_available',
        'branch_price',
    ];

    protected $casts = [
        'is_available' => 'boolean',
        'branch_price' => 'decimal:2',
    ];

    /**
     * Get the effective price for this variation at this branch
     * Returns branch_price if set, otherwise returns the variation's default price
     */
    public function getEffectivePrice(): float
    {
        if ($this->branch_price !== null) {
            return (float) $this->branch_price;
        }

        return (float) $this->variation->price;
    }

    /**
     * Get the branch that owns this availability record
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Get the variation that owns this availability record
     */
    public function variation(): BelongsTo
    {
        return $this->belongsTo(ItemVariation::class, 'variation_id');
    }
}
