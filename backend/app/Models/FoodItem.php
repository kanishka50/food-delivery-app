<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class FoodItem extends Model
{
    use SoftDeletes;

    protected $table = 'food_items';

    protected $fillable = [
        'category_id',
        'item_name',
        'item_slug',
        'description',
        'ingredients',
        'image',
        // 'base_price', // DEPRECATED - prices now stored in item_variations table
        'has_variations', // Always true in new variant-based pricing system
        'is_vegetarian',
        'is_vegan',
        'is_spicy',
        'spicy_level',
        'preparation_time_minutes',
        'display_order',
        'is_available',
        'is_featured',
        'is_active',
        'average_rating',
        'total_ratings',
        'total_orders',
    ];

    protected function casts(): array
    {
        return [
            // 'base_price' => 'decimal:2', // DEPRECATED
            'has_variations' => 'boolean',
            'is_vegetarian' => 'boolean',
            'is_vegan' => 'boolean',
            'is_spicy' => 'boolean',
            'spicy_level' => 'integer',
            'preparation_time_minutes' => 'integer',
            'display_order' => 'integer',
            'is_available' => 'boolean',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
            'average_rating' => 'decimal:2',
            'total_ratings' => 'integer',
            'total_orders' => 'integer',
        ];
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($item) {
            if (empty($item->item_slug)) {
                $item->item_slug = Str::slug($item->item_name);
            }
        });
    }

    public function category()
    {
        return $this->belongsTo(FoodCategory::class, 'category_id');
    }

    public function variations()
    {
        return $this->hasMany(ItemVariation::class, 'food_item_id');
    }

    public function activeVariations()
    {
        return $this->hasMany(ItemVariation::class, 'food_item_id')
            ->where('is_available', true)
            ->orderBy('display_order');
    }

    // DEPRECATED: branchAvailability() and branches() - Old branch_menu_availability table dropped
    // Branch availability now controlled at VARIANT level via branch_variation_availability table
    // Use: $foodItem->variations->first()->branches() to get branch availability

    public function reviews()
    {
        return $this->hasMany(FoodReview::class, 'food_item_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeAvailable($query)
    {
        return $query->where('is_available', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('display_order', 'asc');
    }

    // DEPRECATED: getEffectivePrice() - Prices now stored in item_variations table
    // Use variations relationship to get prices instead
}
