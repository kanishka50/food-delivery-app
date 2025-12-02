<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cart extends Model
{
    protected $fillable = [
        'user_id',
        'branch_id',
        'session_id',
        'subtotal',
        'delivery_fee',
        'tax_amount',
        'discount_amount',
        'promo_code_id',
        'total',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'delivery_fee' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'total' => 'decimal:2',
            'expires_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function items()
    {
        return $this->hasMany(CartItem::class);
    }

    public function promoCode()
    {
        return $this->belongsTo(PromoCode::class);
    }

    public function recalculateTotals()
    {
        $subtotal = $this->items->sum(function ($item) {
            return $item->unit_price * $item->quantity;
        });

        $this->subtotal = $subtotal;
        $this->total = $subtotal + $this->delivery_fee + $this->tax_amount - $this->discount_amount;
        $this->save();

        return $this;
    }
}
