'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { menuApi } from '@/lib/api';
import { Category, FoodItem } from '@/types';
import CategoryCard from '@/components/ui/CategoryCard';
import FoodCard from '@/components/ui/FoodCard';
import LocationPromptModal from '@/components/ui/LocationPromptModal';
import { useLocationStore } from '@/store/locationStore';

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredItems, setFeaturedItems] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);

  const {
    selectedBranch,
    hasPromptedLocation,
    deliveryLocation,
    setHasPromptedLocation,
  } = useLocationStore();

  // Show location modal on first visit
  useEffect(() => {
    if (!hasPromptedLocation && !deliveryLocation) {
      // Small delay to let the page render first
      const timer = setTimeout(() => {
        setShowLocationModal(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [hasPromptedLocation, deliveryLocation]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const branchId = selectedBranch?.id;
        console.log('[HomePage] Fetching with branchId:', branchId, 'selectedBranch:', selectedBranch);

        const [categoriesRes, featuredRes] = await Promise.all([
          menuApi.getCategories(),
          menuApi.getFeaturedItems(branchId),
        ]);

        console.log('[HomePage] Featured items response:', featuredRes.data);

        setCategories(categoriesRes.data.data);
        setFeaturedItems(featuredRes.data.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedBranch?.id]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/menu?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const handleCloseLocationModal = () => {
    setShowLocationModal(false);
    setHasPromptedLocation(true);
  };

  const branchSelected = !!selectedBranch;

  return (
    <div className="bg-gray-50">
      {/* Location Prompt Modal */}
      <LocationPromptModal
        isOpen={showLocationModal}
        onClose={handleCloseLocationModal}
        onSkip={handleCloseLocationModal}
      />

      {/* Location Bar - Shows selected location */}
      {deliveryLocation && selectedBranch && (
        <div className="bg-orange-50 border-b border-orange-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-gray-600">
                  Delivering to: <span className="font-medium text-gray-900">{deliveryLocation.address || deliveryLocation.city || 'Your location'}</span>
                </span>
                <span className="text-gray-400">|</span>
                <span className="text-gray-600">
                  Branch: <span className="font-medium text-orange-600">{selectedBranch.branch_name}</span>
                  <span className="text-gray-400 ml-1">({selectedBranch.distance_km} km)</span>
                </span>
              </div>
              <button
                onClick={() => setShowLocationModal(true)}
                className="text-orange-500 hover:text-orange-600 text-sm font-medium"
              >
                Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Delicious Food,<br />Delivered to You
            </h1>
            <p className="text-xl text-orange-100 mb-8">
              Order from your favorite local restaurants and enjoy fresh, hot meals delivered right to your doorstep.
            </p>

            {/* Location prompt if not set */}
            {!deliveryLocation && (
              <button
                onClick={() => setShowLocationModal(true)}
                className="mb-6 flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Set your delivery location for accurate prices</span>
              </button>
            )}

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search for food..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-4 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
                <svg
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button
                type="submit"
                className="bg-gray-900 text-white px-8 py-4 rounded-lg font-medium hover:bg-gray-800 transition"
              >
                Search
              </button>
            </form>
          </div>
        </div>

        {/* Decorative shapes */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gray-50" style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 0)' }} />
      </section>

      {/* Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Browse Categories</h2>
            <p className="text-gray-600 mt-1">Find your favorite cuisine</p>
          </div>
          <Link
            href="/menu"
            className="text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1"
          >
            View All
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.slice(0, 8).map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
      </section>

      {/* Featured Items Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Featured Items</h2>
              <p className="text-gray-600 mt-1">Our most popular dishes</p>
            </div>
            <Link
              href="/menu"
              className="text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1"
            >
              View Menu
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-xl h-72 animate-pulse" />
              ))}
            </div>
          ) : featuredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredItems.map((item) => (
                <FoodCard key={item.id} item={item} branchSelected={branchSelected} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No featured items available
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-gray-900">How It Works</h2>
          <p className="text-gray-600 mt-2">Order your favorite food in 3 simple steps</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Set Location</h3>
            <p className="text-gray-600">
              Share your location or enter your address to find nearby branches
            </p>
          </div>

          {/* Step 2 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Add to Cart</h3>
            <p className="text-gray-600">
              Select your favorite items and customize them to your taste
            </p>
          </div>

          {/* Step 3 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Fast Delivery</h3>
            <p className="text-gray-600">
              Sit back and relax while we deliver your food hot and fresh
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Order?</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Download our mobile app for a better experience and exclusive offers
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/menu"
              className="bg-orange-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-orange-600 transition"
            >
              Order Now
            </Link>
            <Link
              href="/register"
              className="bg-white text-gray-900 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
