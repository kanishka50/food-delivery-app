<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class FoodCategory extends Model
{
    use SoftDeletes;

    protected $table = 'food_categories';

    protected $fillable = [
        'category_name',
        'category_slug',
        'description',
        'image',
        'display_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'display_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($category) {
            if (empty($category->category_slug)) {
                $category->category_slug = Str::slug($category->category_name);
            }
        });
    }

    public function foodItems()
    {
        return $this->hasMany(FoodItem::class, 'category_id');
    }

    public function activeFoodItems()
    {
        return $this->hasMany(FoodItem::class, 'category_id')
            ->where('is_active', true)
            ->where('is_available', true);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('display_order', 'asc');
    }
}
