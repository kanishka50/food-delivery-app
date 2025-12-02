'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { menuApi } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import { useLocationStore } from '@/store/locationStore';
import { FoodItem, FoodCategory } from '@/types';

export default function MenuPage() {
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [items, setItems] = useState<FoodItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    is_vegetarian: false,
    spicy_level: null as number | null,
    sort_by: 'item_name',
    sort_dir: 'asc',
  });

  const { selectedBranch } = useLocationStore();

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await menuApi.getCategories();
        setCategories(response.data.data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch items based on category and filters
  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      try {
        let response;
        if (searchQuery) {
          response = await menuApi.searchItems(searchQuery, selectedBranch?.id);
        } else if (selectedCategory) {
          response = await menuApi.getCategoryItems(selectedCategory, selectedBranch?.id);
        } else {
          response = await menuApi.getItems({
            branch_id: selectedBranch?.id,
            is_vegetarian: filters.is_vegetarian || undefined,
            spicy_level: filters.spicy_level || undefined,
            sort_by: filters.sort_by,
            sort_dir: filters.sort_dir,
          });
        }
        setItems(response.data.data.items || response.data.data);
      } catch (error) {
        console.error('Failed to fetch items:', error);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchItems, searchQuery ? 300 : 0);
    return () => clearTimeout(debounce);
  }, [selectedCategory, selectedBranch?.id, searchQuery, filters]);

  const handleCategoryClick = (slug: string | null) => {
    setSelectedCategory(slug);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Search Bar */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search for dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => handleCategoryClick(null)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition ${
                selectedCategory === null
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Items
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.category_slug)}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition ${
                  selectedCategory === category.category_slug
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.category_name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Vegetarian Filter */}
            <button
              onClick={() => setFilters({ ...filters, is_vegetarian: !filters.is_vegetarian })}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                filters.is_vegetarian
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              Vegetarian
            </button>

            {/* Spicy Level Filter */}
            <select
              value={filters.spicy_level || ''}
              onChange={(e) => setFilters({ ...filters, spicy_level: e.target.value ? Number(e.target.value) : null })}
              className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 text-gray-600 border-0 focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Spice Levels</option>
              <option value="0">Not Spicy</option>
              <option value="1">Mild</option>
              <option value="2">Medium</option>
              <option value="3">Hot</option>
            </select>

            {/* Sort */}
            <select
              value={`${filters.sort_by}-${filters.sort_dir}`}
              onChange={(e) => {
                const [sort_by, sort_dir] = e.target.value.split('-');
                setFilters({ ...filters, sort_by, sort_dir });
              }}
              className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 text-gray-600 border-0 focus:ring-2 focus:ring-orange-500"
            >
              <option value="item_name-asc">Name (A-Z)</option>
              <option value="item_name-desc">Name (Z-A)</option>
              <option value="base_price-asc">Price (Low to High)</option>
              <option value="base_price-desc">Price (High to Low)</option>
            </select>

            {/* Branch indicator */}
            {selectedBranch && (
              <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Prices for {selectedBranch.branch_name}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-4">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                  <div className="h-6 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No items found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <MenuItemCard key={item.id} item={item} branchId={selectedBranch?.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MenuItemCard({ item, branchId }: { item: FoodItem; branchId?: number }) {
  // Check if item is available at selected branch (from API response)
  // When branchId is set, API returns is_available_at_branch
  const isAvailableAtBranch = branchId ? item.is_available_at_branch !== false : true;
  const canOrder = isAvailableAtBranch;

  // Get price from API response (starting_price is already calculated by backend)
  const hasVariants = item.variations && item.variations.length > 1;
  const displayPrice = item.starting_price;

  // Show price range if available and no branch selected
  const showPriceRange = !branchId && item.price_range;

  return (
    <Link
      href={`/menu/${item.slug}`}
      className={`group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition ${
        !canOrder ? 'opacity-60' : ''
      }`}
    >
      {/* Image */}
      <div className="relative h-48 bg-gray-100">
        {getImageUrl(item.image) ? (
          <Image
            src={getImageUrl(item.image)!}
            alt={item.name}
            fill
            className="object-cover group-hover:scale-105 transition duration-300"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {item.is_vegetarian && (
            <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">Veg</span>
          )}
          {item.is_featured && (
            <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">Featured</span>
          )}
        </div>

        {/* Unavailable overlay */}
        {!canOrder && branchId && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
              Not at this branch
            </span>
          </div>
        )}

        {/* Spicy indicator */}
        {item.spicy_level > 0 && (
          <div className="absolute top-2 right-2 flex">
            {[...Array(item.spicy_level)].map((_, i) => (
              <span key={i} className="text-red-500">🌶</span>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{item.name}</h3>
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{item.description || 'Delicious dish'}</p>

        <div className="flex items-center justify-between">
          <div>
            {hasVariants && <span className="text-sm text-gray-500">From </span>}
            <span className="text-lg font-bold text-orange-500">
              Rs. {displayPrice.toFixed(2)}
            </span>
            {showPriceRange && (
              <span className="text-xs text-gray-400 ml-1">
                - Rs. {item.price_range!.max.toFixed(2)}
              </span>
            )}
          </div>

          {canOrder && (
            <button className="bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
