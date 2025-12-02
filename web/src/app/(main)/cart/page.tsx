'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useLocationStore } from '@/store/locationStore';
import { useAuthStore } from '@/store/authStore';
import { getImageUrl } from '@/lib/utils';

export default function CartPage() {
  const router = useRouter();
  const { cart, isLoading, error, fetchCart, updateItem, removeItem, clearCart, applyPromoCode, removePromoCode, clearError } = useCartStore();
  const { selectedBranch, deliveryLocation } = useLocationStore();
  const { isAuthenticated } = useAuthStore();

  const [promoCode, setPromoCode] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [promoError, setPromoError] = useState('');

  // Fetch cart on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  // Handle quantity update
  const handleQuantityChange = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > 20) return;
    try {
      await updateItem(itemId, newQuantity);
    } catch {
      // Error handled by store
    }
  };

  // Handle remove item
  const handleRemoveItem = async (itemId: number) => {
    try {
      await removeItem(itemId);
    } catch {
      // Error handled by store
    }
  };

  // Handle clear cart
  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      try {
        await clearCart();
      } catch {
        // Error handled by store
      }
    }
  };

  // Handle promo code
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setIsApplyingPromo(true);
    setPromoError('');
    try {
      await applyPromoCode(promoCode.trim());
      setPromoCode('');
    } catch {
      setPromoError('Invalid or expired promo code');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleRemovePromo = async () => {
    try {
      await removePromoCode();
    } catch {
      // Error handled by store
    }
  };

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please log in</h2>
          <p className="text-gray-500 mb-6">You need to be logged in to view your cart</p>
          <Link
            href="/login?redirect=/cart"
            className="inline-block bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-600 transition"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  // Loading
  if (isLoading && !cart) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Cart</h1>
          <div className="bg-white rounded-2xl p-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 py-4 border-b border-gray-100 last:border-0">
                <div className="w-20 h-20 bg-gray-200 rounded-lg" />
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty cart
  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Looks like you haven&apos;t added anything yet</p>
          <Link
            href="/menu"
            className="inline-block bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-600 transition"
          >
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Your Cart</h1>
          <button
            onClick={handleClearCart}
            className="text-sm text-red-500 hover:text-red-600 font-medium"
          >
            Clear Cart
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={clearError} className="text-red-400 hover:text-red-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Branch Warning */}
        {selectedBranch && (
          <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-3">
            <svg className="w-5 h-5 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <p className="text-sm text-orange-700">
                Delivery from <strong>{selectedBranch.branch_name}</strong>
                {deliveryLocation?.address && (
                  <span className="text-orange-600"> to {deliveryLocation.address.split(',')[0]}</span>
                )}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {cart.items.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 border-b border-gray-100 last:border-0">
                  {/* Image */}
                  <Link href={`/menu/${item.food_item.slug}`} className="flex-shrink-0">
                    <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                      {getImageUrl(item.food_item.image) ? (
                        <Image
                          src={getImageUrl(item.food_item.image)!}
                          alt={item.food_item.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/menu/${item.food_item.slug}`} className="font-medium text-gray-900 hover:text-orange-500 line-clamp-1">
                      {item.food_item.name}
                    </Link>
                    {item.variation && (
                      <p className="text-sm text-gray-500">{item.variation.size_name}</p>
                    )}
                    <p className="text-sm text-orange-500 font-medium">Rs. {Number(item.unit_price).toFixed(2)}</p>
                    {item.special_instructions && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">Note: {item.special_instructions}</p>
                    )}
                  </div>

                  {/* Quantity & Actions */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center border border-gray-200 rounded-lg">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={isLoading || item.quantity <= 1}
                        className="px-2 py-1 text-gray-600 hover:text-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="px-3 py-1 text-sm font-medium text-gray-900">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        disabled={isLoading || item.quantity >= 20}
                        className="px-2 py-1 text-gray-600 hover:text-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">Rs. {Number(item.total).toFixed(2)}</p>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={isLoading}
                        className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Continue Shopping */}
            <div className="mt-4">
              <Link href="/menu" className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

              {/* Promo Code */}
              <div className="mb-4">
                {cart.promo_code ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-green-700">{cart.promo_code.code}</p>
                      <p className="text-xs text-green-600">
                        {cart.promo_code.discount_type === 'percentage'
                          ? `${cart.promo_code.discount_value}% off`
                          : `Rs. ${cart.promo_code.discount_value} off`}
                      </p>
                    </div>
                    <button
                      onClick={handleRemovePromo}
                      disabled={isLoading}
                      className="text-green-600 hover:text-green-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        placeholder="Promo code"
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <button
                        onClick={handleApplyPromo}
                        disabled={isApplyingPromo || !promoCode.trim()}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isApplyingPromo ? '...' : 'Apply'}
                      </button>
                    </div>
                    {promoError && (
                      <p className="text-xs text-red-500 mt-1">{promoError}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="space-y-3 border-t border-gray-100 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal ({cart.item_count} items)</span>
                  <span className="text-gray-900">Rs. {Number(cart.subtotal).toFixed(2)}</span>
                </div>
                {Number(cart.discount_amount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Discount</span>
                    <span className="text-green-600">-Rs. {Number(cart.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Delivery Fee</span>
                  <span className="text-gray-900">
                    {Number(cart.delivery_fee) > 0 ? `Rs. ${Number(cart.delivery_fee).toFixed(2)}` : 'Free'}
                  </span>
                </div>
                {Number(cart.tax_amount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tax</span>
                    <span className="text-gray-900">Rs. {Number(cart.tax_amount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t border-gray-100 pt-3">
                  <span className="text-gray-900">Total</span>
                  <span className="text-orange-500">Rs. {Number(cart.total).toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => router.push('/checkout')}
                disabled={!selectedBranch}
                className="w-full mt-6 py-4 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {selectedBranch ? 'Proceed to Checkout' : 'Select Delivery Location First'}
              </button>

              {!selectedBranch && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  Please set your delivery location to continue
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
