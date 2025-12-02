<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CartItem extends Model
{
    protected $fillable = [
        'cart_id',
        'food_item_id',
        'variation_id',
        'quantity',
        'unit_price',
        'special_instructions',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'unit_price' => 'decimal:2',
        ];
    }

    public function cart()
    {
        return $this->belongsTo(Cart::class);
    }

    public function foodItem()
    {
        return $this->belongsTo(FoodItem::class);
    }

    public function variation()
    {
        return $this->belongsTo(ItemVariation::class);
    }

    public function getTotalAttribute()
    {
        return $this->unit_price * $this->quantity;
    }
}
