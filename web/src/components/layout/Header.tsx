'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useLocationStore } from '@/store/locationStore';
import LocationPromptModal from '@/components/ui/LocationPromptModal';

export default function Header() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { cart } = useCartStore();
  const { deliveryLocation, selectedBranch } = useLocationStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const handleLogout = async () => {
    await logout();
    setIsProfileOpen(false);
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">F</span>
            </div>
            <span className="text-xl font-bold text-gray-900">FoodDelivery</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-600 hover:text-orange-500 transition">
              Home
            </Link>
            <Link href="/menu" className="text-gray-600 hover:text-orange-500 transition">
              Menu
            </Link>
            <Link href="/branches" className="text-gray-600 hover:text-orange-500 transition">
              Locations
            </Link>
          </nav>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Location Indicator */}
            <button
              onClick={() => setShowLocationModal(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition max-w-[200px]"
            >
              <svg
                className={`w-4 h-4 flex-shrink-0 ${deliveryLocation ? 'text-orange-500' : 'text-gray-400'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {deliveryLocation ? (
                <span className="text-sm text-gray-700 truncate">
                  {deliveryLocation.city || deliveryLocation.address?.split(',')[0] || 'Location set'}
                </span>
              ) : (
                <span className="text-sm text-gray-500">Set location</span>
              )}
              <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Mobile Location Button */}
            <button
              onClick={() => setShowLocationModal(true)}
              className="sm:hidden p-2 text-gray-600 hover:text-orange-500 transition"
              title={deliveryLocation ? deliveryLocation.address || 'Change location' : 'Set location'}
            >
              <svg
                className={`w-5 h-5 ${deliveryLocation ? 'text-orange-500' : 'text-gray-400'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>

            {/* Cart */}
            <Link href="/cart" className="relative p-2 text-gray-600 hover:text-orange-500 transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cart && cart.item_count > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {cart.item_count}
                </span>
              )}
            </Link>

            {/* Auth */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition"
                >
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 font-medium text-sm">
                      {user?.first_name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <span className="hidden sm:block">{user?.first_name}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-gray-700 hover:bg-orange-50"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      My Profile
                    </Link>
                    <Link
                      href="/orders"
                      className="block px-4 py-2 text-gray-700 hover:bg-orange-50"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      My Orders
                    </Link>
                    <Link
                      href="/addresses"
                      className="block px-4 py-2 text-gray-700 hover:bg-orange-50"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      My Addresses
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-orange-500 transition px-3 py-2"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-600"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-2">
              <Link href="/" className="text-gray-600 hover:text-orange-500 py-2" onClick={() => setIsMenuOpen(false)}>
                Home
              </Link>
              <Link href="/menu" className="text-gray-600 hover:text-orange-500 py-2" onClick={() => setIsMenuOpen(false)}>
                Menu
              </Link>
              <Link href="/branches" className="text-gray-600 hover:text-orange-500 py-2" onClick={() => setIsMenuOpen(false)}>
                Locations
              </Link>
            </nav>
          </div>
        )}
      </div>

      {/* Location Modal */}
      <LocationPromptModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </header>
  );
}
