'use client';

import Link from 'next/link';
import { FoodItem } from '@/types';
import { getImageUrl } from '@/lib/utils';

interface FoodCardProps {
  item: FoodItem;
  branchSelected?: boolean; // Whether user has selected a delivery location
}

export default function FoodCard({ item, branchSelected = false }: FoodCardProps) {
  const imageUrl = getImageUrl(item.image);

  // Determine if item is unavailable at the selected branch
  const isUnavailable = branchSelected && item.is_available_at_branch === false;

  // Format price display
  const formatPrice = () => {
    // If branch is selected, show the effective starting price
    if (branchSelected) {
      return (
        <span className="font-bold text-orange-500">
          Rs. {item.starting_price.toFixed(2)}
        </span>
      );
    }

    // If no branch selected and there's a price range, show the range
    if (item.price_range) {
      return (
        <span className="font-bold text-orange-500">
          Rs. {item.price_range.min.toFixed(2)} - {item.price_range.max.toFixed(2)}
        </span>
      );
    }

    // Default: show starting price
    return (
      <span className="font-bold text-orange-500">
        Rs. {item.starting_price.toFixed(2)}
      </span>
    );
  };

  return (
    <Link
      href={`/menu/${item.slug}`}
      className={`group ${isUnavailable ? 'cursor-not-allowed' : ''}`}
      onClick={(e) => {
        if (isUnavailable) {
          e.preventDefault();
        }
      }}
    >
      <div
        className={`bg-white rounded-xl shadow-sm overflow-hidden transition-shadow ${
          isUnavailable
            ? 'opacity-60 grayscale'
            : 'hover:shadow-md'
        }`}
      >
        {/* Image */}
        <div className="relative h-48 bg-gray-100 overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.name}
              className={`absolute inset-0 w-full h-full object-cover transition-transform duration-300 ${
                isUnavailable ? '' : 'group-hover:scale-105'
              }`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Unavailable overlay */}
          {isUnavailable && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-gray-800 text-white text-xs px-3 py-1.5 rounded-full font-medium">
                Not available at your location
              </span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {item.is_vegetarian && (
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">Veg</span>
            )}
            {item.is_vegan && (
              <span className="bg-emerald-600 text-white text-xs px-2 py-1 rounded-full">Vegan</span>
            )}
            {item.is_featured && (
              <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">Featured</span>
            )}
          </div>

          {/* Spicy indicator */}
          {item.is_spicy && item.spicy_level > 0 && (
            <div className="absolute top-2 right-2 flex">
              {[...Array(Math.min(item.spicy_level, 5))].map((_, i) => (
                <span key={i} className="text-red-500 text-sm">🌶️</span>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Category */}
          {item.category && (
            <p className="text-xs text-orange-500 font-medium mb-1">{item.category.name}</p>
          )}

          {/* Name */}
          <h3 className={`font-semibold mb-1 line-clamp-1 ${isUnavailable ? 'text-gray-500' : 'text-gray-900'}`}>
            {item.name}
          </h3>

          {/* Description */}
          {item.description && (
            <p className="text-sm text-gray-500 mb-2 line-clamp-2">{item.description}</p>
          )}

          {/* Rating & Price */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-1">
              {item.average_rating > 0 && (
                <>
                  <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                  </svg>
                  <span className="text-sm text-gray-600">{item.average_rating.toFixed(1)}</span>
                  <span className="text-xs text-gray-400">({item.total_ratings})</span>
                </>
              )}
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-500">
                {!branchSelected && item.price_range ? '' : 'From '}{formatPrice()}
              </p>
              {/* Show variation count if multiple */}
              {item.variations.length > 1 && (
                <p className="text-xs text-gray-400">{item.variations.length} options</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
