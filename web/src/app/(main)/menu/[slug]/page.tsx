'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { menuApi } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import { useLocationStore } from '@/store/locationStore';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { FoodItem, FoodItemVariation } from '@/types';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [item, setItem] = useState<FoodItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected options
  const [selectedVariation, setSelectedVariation] = useState<FoodItemVariation | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Cart state
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const { selectedBranch } = useLocationStore();
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  // Fetch item details
  useEffect(() => {
    const fetchItem = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await menuApi.getItemDetail(slug, selectedBranch?.id);
        const itemData = response.data.data;
        setItem(itemData);

        // Set default variation (first available or first one)
        if (itemData.variations && itemData.variations.length > 0) {
          const defaultVariation = itemData.variations.find(
            (v: FoodItemVariation) => v.is_default && (selectedBranch ? v.is_available_at_branch !== false : true)
          ) || itemData.variations.find(
            (v: FoodItemVariation) => selectedBranch ? v.is_available_at_branch !== false : true
          ) || itemData.variations[0];
          setSelectedVariation(defaultVariation);
        }
      } catch (err) {
        console.error('Failed to fetch item:', err);
        setError('Failed to load item details');
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchItem();
    }
  }, [slug, selectedBranch?.id]);

  // Calculate price
  const getPrice = () => {
    if (!selectedVariation) return 0;
    // Use effective_price which accounts for branch pricing
    return selectedVariation.effective_price || selectedVariation.default_price;
  };

  const totalPrice = getPrice() * quantity;

  // Check availability
  const isItemAvailable = selectedBranch ? item?.is_available_at_branch !== false : true;
  const isVariationAvailable = selectedBranch ? selectedVariation?.is_available_at_branch !== false : true;
  const canAddToCart = isItemAvailable && isVariationAvailable && selectedVariation;

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!canAddToCart || !item || !selectedVariation) return;

    if (!isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent(`/menu/${slug}`));
      return;
    }

    setIsAddingToCart(true);
    try {
      await addItem(item.id, quantity, selectedVariation.id, specialInstructions || undefined);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (err) {
      console.error('Failed to add to cart:', err);
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
            <div className="h-72 bg-gray-200" />
            <div className="p-6">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Item not found</h2>
          <p className="text-gray-500 mb-4">{error || 'The item you are looking for does not exist.'}</p>
          <Link href="/menu" className="text-orange-500 hover:text-orange-600 font-medium">
            ← Back to Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-orange-500">Home</Link>
            <span className="text-gray-300">/</span>
            <Link href="/menu" className="text-gray-500 hover:text-orange-500">Menu</Link>
            {item.category && (
              <>
                <span className="text-gray-300">/</span>
                <Link href={`/menu?category=${item.category.slug}`} className="text-gray-500 hover:text-orange-500">
                  {item.category.name}
                </Link>
              </>
            )}
            <span className="text-gray-300">/</span>
            <span className="text-gray-900">{item.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {/* Image */}
          <div className="relative h-72 md:h-96 bg-gray-100">
            {getImageUrl(item.image) ? (
              <Image
                src={getImageUrl(item.image)!}
                alt={item.name}
                fill
                className="object-cover"
                priority
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {item.is_vegetarian && (
                <span className="bg-green-500 text-white text-sm px-3 py-1 rounded-full">Vegetarian</span>
              )}
              {item.is_vegan && (
                <span className="bg-green-600 text-white text-sm px-3 py-1 rounded-full">Vegan</span>
              )}
              {item.is_featured && (
                <span className="bg-orange-500 text-white text-sm px-3 py-1 rounded-full">Featured</span>
              )}
            </div>

            {/* Unavailable Banner */}
            {!isItemAvailable && selectedBranch && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="bg-white rounded-lg px-6 py-4 text-center">
                  <p className="text-lg font-semibold text-gray-900">Not Available</p>
                  <p className="text-sm text-gray-500">This item is not available at {selectedBranch.branch_name}</p>
                </div>
              </div>
            )}

            {/* Spicy indicator */}
            {item.spicy_level > 0 && (
              <div className="absolute top-4 right-4 bg-white rounded-full px-3 py-1 flex items-center gap-1">
                {[...Array(item.spicy_level)].map((_, i) => (
                  <span key={i} className="text-lg">🌶</span>
                ))}
                <span className="text-sm text-gray-600 ml-1">
                  {item.spicy_level === 1 ? 'Mild' : item.spicy_level === 2 ? 'Medium' : 'Hot'}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{item.name}</h1>
                  {item.category && (
                    <p className="text-sm text-gray-500">{item.category.name}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 mb-1">
                    <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                    <span className="font-semibold">{item.average_rating.toFixed(1)}</span>
                    <span className="text-sm text-gray-500">({item.total_ratings} reviews)</span>
                  </div>
                  {item.preparation_time_minutes && (
                    <p className="text-sm text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {item.preparation_time_minutes} mins
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {item.description && (
              <div className="mb-6">
                <p className="text-gray-600">{item.description}</p>
              </div>
            )}

            {/* Ingredients */}
            {item.ingredients && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Ingredients</h3>
                <p className="text-sm text-gray-600">{item.ingredients}</p>
              </div>
            )}

            {/* Branch indicator */}
            {selectedBranch && (
              <div className="mb-6 p-3 bg-orange-50 rounded-lg flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm text-orange-700">
                  Prices shown for <strong>{selectedBranch.branch_name}</strong>
                </span>
              </div>
            )}

            {/* Variations */}
            {item.variations && item.variations.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Select Size/Variant</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {item.variations.map((variation) => {
                    const isAvailable = selectedBranch ? variation.is_available_at_branch !== false : true;
                    const price = variation.effective_price || variation.default_price;
                    const isSelected = selectedVariation?.id === variation.id;

                    return (
                      <button
                        key={variation.id}
                        onClick={() => isAvailable && setSelectedVariation(variation)}
                        disabled={!isAvailable}
                        className={`p-4 rounded-xl border-2 text-left transition ${
                          isSelected
                            ? 'border-orange-500 bg-orange-50'
                            : isAvailable
                            ? 'border-gray-200 hover:border-gray-300'
                            : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <p className={`font-medium ${isSelected ? 'text-orange-600' : 'text-gray-900'}`}>
                          {variation.name}
                        </p>
                        <p className={`text-sm ${isSelected ? 'text-orange-500' : 'text-gray-500'}`}>
                          Rs. {price.toFixed(2)}
                        </p>
                        {!isAvailable && selectedBranch && (
                          <p className="text-xs text-red-500 mt-1">Not available</p>
                        )}
                        {variation.branch_price !== null && variation.branch_price !== undefined && selectedBranch && (
                          <p className="text-xs text-green-600 mt-1">Branch price</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Quantity</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-200 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 text-gray-600 hover:text-orange-500 transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="px-4 py-2 font-semibold text-gray-900 min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(20, quantity + 1))}
                    className="px-4 py-2 text-gray-600 hover:text-orange-500 transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-500">Maximum 20 per order</p>
              </div>
            </div>

            {/* Special Instructions */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Special Instructions (Optional)</h3>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Any allergies or special requests? Let us know..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{specialInstructions.length}/500</p>
            </div>

            {/* Add to Cart */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">Rs. {totalPrice.toFixed(2)}</p>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={!canAddToCart || isAddingToCart}
                className={`flex-1 py-4 rounded-xl font-semibold text-white transition flex items-center justify-center gap-2 ${
                  canAddToCart && !isAddingToCart
                    ? addedToCart
                      ? 'bg-green-500'
                      : 'bg-orange-500 hover:bg-orange-600'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {isAddingToCart ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Adding...
                  </>
                ) : addedToCart ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Added to Cart!
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Add to Cart
                  </>
                )}
              </button>
            </div>

            {!isAuthenticated && (
              <p className="text-center text-sm text-gray-500 mt-4">
                <Link href="/login" className="text-orange-500 hover:underline">Log in</Link> to add items to your cart
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
