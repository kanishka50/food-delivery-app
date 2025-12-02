<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\FoodItem;
use App\Models\ItemVariation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CartController extends Controller
{
    /**
     * Get current user's cart
     */
    public function index(Request $request)
    {
        $cart = $this->getOrCreateCart($request->user());

        return response()->json([
            'success' => true,
            'data' => $this->formatCart($cart),
        ]);
    }

    /**
     * Add item to cart
     */
    public function addItem(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'food_item_id' => 'required|exists:food_items,id',
            'variation_id' => 'nullable|exists:item_variations,id',
            'quantity' => 'required|integer|min:1|max:20',
            'special_instructions' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $foodItem = FoodItem::where('id', $request->food_item_id)
            ->where('is_active', true)
            ->where('is_available', true)
            ->first();

        if (!$foodItem) {
            return response()->json([
                'success' => false,
                'message' => 'Food item not available',
            ], 400);
        }

        // Determine price
        $unitPrice = $foodItem->base_price;

        if ($request->variation_id) {
            $variation = ItemVariation::where('id', $request->variation_id)
                ->where('food_item_id', $foodItem->id)
                ->where('is_available', true)
                ->first();

            if (!$variation) {
                return response()->json([
                    'success' => false,
                    'message' => 'Variation not available',
                ], 400);
            }

            $unitPrice = $variation->price;
        }

        $cart = $this->getOrCreateCart($request->user());

        // Check if item already exists in cart (same item + same variation)
        $existingItem = $cart->items()
            ->where('food_item_id', $foodItem->id)
            ->where('variation_id', $request->variation_id)
            ->first();

        if ($existingItem) {
            $existingItem->update([
                'quantity' => $existingItem->quantity + $request->quantity,
                'special_instructions' => $request->special_instructions ?? $existingItem->special_instructions,
            ]);
        } else {
            $cart->items()->create([
                'food_item_id' => $foodItem->id,
                'variation_id' => $request->variation_id,
                'quantity' => $request->quantity,
                'unit_price' => $unitPrice,
                'special_instructions' => $request->special_instructions,
            ]);
        }

        $cart->recalculateTotals();

        return response()->json([
            'success' => true,
            'message' => 'Item added to cart',
            'data' => $this->formatCart($cart->fresh(['items.foodItem', 'items.variation'])),
        ]);
    }

    /**
     * Update cart item quantity
     */
    public function updateItem(Request $request, $itemId)
    {
        $validator = Validator::make($request->all(), [
            'quantity' => 'required|integer|min:1|max:20',
            'special_instructions' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $cart = $this->getOrCreateCart($request->user());

        $cartItem = $cart->items()->find($itemId);

        if (!$cartItem) {
            return response()->json([
                'success' => false,
                'message' => 'Cart item not found',
            ], 404);
        }

        $cartItem->update([
            'quantity' => $request->quantity,
            'special_instructions' => $request->special_instructions ?? $cartItem->special_instructions,
        ]);

        $cart->recalculateTotals();

        return response()->json([
            'success' => true,
            'message' => 'Cart item updated',
            'data' => $this->formatCart($cart->fresh(['items.foodItem', 'items.variation'])),
        ]);
    }

    /**
     * Remove item from cart
     */
    public function removeItem(Request $request, $itemId)
    {
        $cart = $this->getOrCreateCart($request->user());

        $cartItem = $cart->items()->find($itemId);

        if (!$cartItem) {
            return response()->json([
                'success' => false,
                'message' => 'Cart item not found',
            ], 404);
        }

        $cartItem->delete();
        $cart->recalculateTotals();

        return response()->json([
            'success' => true,
            'message' => 'Item removed from cart',
            'data' => $this->formatCart($cart->fresh(['items.foodItem', 'items.variation'])),
        ]);
    }

    /**
     * Clear entire cart
     */
    public function clear(Request $request)
    {
        $cart = $request->user()->cart;

        if ($cart) {
            $cart->items()->delete();
            $cart->update([
                'subtotal' => 0,
                'discount_amount' => 0,
                'promo_code_id' => null,
                'total' => 0,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Cart cleared',
        ]);
    }

    /**
     * Apply promo code
     */
    public function applyPromoCode(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'promo_code' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $cart = $this->getOrCreateCart($request->user());

        if ($cart->items->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Cart is empty',
            ], 400);
        }

        // Find promo code
        $promoCode = \App\Models\PromoCode::where('code', strtoupper($request->promo_code))
            ->where('is_active', true)
            ->where('valid_from', '<=', now())
            ->where('valid_until', '>=', now())
            ->first();

        if (!$promoCode) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired promo code',
            ], 400);
        }

        // Check minimum order
        if ($cart->subtotal < $promoCode->minimum_order_amount) {
            return response()->json([
                'success' => false,
                'message' => "Minimum order amount of {$promoCode->minimum_order_amount} required",
            ], 400);
        }

        // Check usage limit
        if ($promoCode->max_uses && $promoCode->current_uses >= $promoCode->max_uses) {
            return response()->json([
                'success' => false,
                'message' => 'Promo code usage limit reached',
            ], 400);
        }

        // Calculate discount
        $discount = 0;
        if ($promoCode->discount_type === 'percentage') {
            $discount = ($cart->subtotal * $promoCode->discount_value) / 100;
            if ($promoCode->max_discount_amount) {
                $discount = min($discount, $promoCode->max_discount_amount);
            }
        } else {
            $discount = min($promoCode->discount_value, $cart->subtotal);
        }

        $cart->update([
            'promo_code_id' => $promoCode->id,
            'discount_amount' => $discount,
        ]);

        $cart->recalculateTotals();

        return response()->json([
            'success' => true,
            'message' => 'Promo code applied',
            'data' => $this->formatCart($cart->fresh(['items.foodItem', 'items.variation', 'promoCode'])),
        ]);
    }

    /**
     * Remove promo code
     */
    public function removePromoCode(Request $request)
    {
        $cart = $request->user()->cart;

        if ($cart) {
            $cart->update([
                'promo_code_id' => null,
                'discount_amount' => 0,
            ]);
            $cart->recalculateTotals();
        }

        return response()->json([
            'success' => true,
            'message' => 'Promo code removed',
            'data' => $cart ? $this->formatCart($cart->fresh(['items.foodItem', 'items.variation'])) : null,
        ]);
    }

    /**
     * Get or create cart for user
     */
    private function getOrCreateCart($user)
    {
        $cart = Cart::firstOrCreate(
            ['user_id' => $user->id],
            [
                'subtotal' => 0,
                'delivery_fee' => 0,
                'tax_amount' => 0,
                'discount_amount' => 0,
                'total' => 0,
                'expires_at' => now()->addDays(7),
            ]
        );

        $cart->load(['items.foodItem', 'items.variation', 'promoCode']);

        return $cart;
    }

    /**
     * Format cart for API response
     */
    private function formatCart($cart)
    {
        return [
            'id' => $cart->id,
            'items' => $cart->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'food_item' => [
                        'id' => $item->foodItem->id,
                        'name' => $item->foodItem->item_name,
                        'slug' => $item->foodItem->item_slug,
                        'image' => $item->foodItem->image,
                    ],
                    'variation' => $item->variation ? [
                        'id' => $item->variation->id,
                        'size_name' => $item->variation->size_name,
                    ] : null,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'total' => $item->total,
                    'special_instructions' => $item->special_instructions,
                ];
            }),
            'item_count' => $cart->items->sum('quantity'),
            'subtotal' => $cart->subtotal,
            'delivery_fee' => $cart->delivery_fee,
            'tax_amount' => $cart->tax_amount,
            'discount_amount' => $cart->discount_amount,
            'promo_code' => $cart->promoCode ? [
                'code' => $cart->promoCode->code,
                'discount_type' => $cart->promoCode->discount_type,
                'discount_value' => $cart->promoCode->discount_value,
            ] : null,
            'total' => $cart->total,
        ];
    }
}
