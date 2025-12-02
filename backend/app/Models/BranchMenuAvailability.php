<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BranchMenuAvailability extends Model
{
    protected $table = 'branch_menu_availability';

    protected $fillable = [
        'branch_id',
        'food_item_id',
        'is_available',
        'custom_price',
    ];

    protected function casts(): array
    {
        return [
            'is_available' => 'boolean',
            'custom_price' => 'decimal:2',
        ];
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function foodItem()
    {
        return $this->belongsTo(FoodItem::class, 'food_item_id');
    }
}
