'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useAddressStore } from '@/store/addressStore';
import Link from 'next/link';

export default function AddressesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { addresses, isLoading, error, fetchAddresses, deleteAddress, setDefaultAddress, clearError } = useAddressStore();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchAddresses();
  }, [isAuthenticated, router, fetchAddresses]);

  const handleSetDefault = async (id: number) => {
    try {
      clearError();
      setSuccess('');
      await setDefaultAddress(id);
      setSuccess('Default address updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      // Error handled by store
    }
  };

  const handleDelete = async (id: number) => {
    try {
      clearError();
      setSuccess('');
      await deleteAddress(id);
      setSuccess('Address deleted successfully!');
      setDeleteId(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      // Error handled by store
    }
  };

  if (isLoading && addresses.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/profile"
            className="inline-flex items-center text-sm text-orange-600 hover:text-orange-700 mb-4"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Profile
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Delivery Addresses</h1>
              <p className="mt-2 text-gray-600">Manage your saved delivery addresses</p>
            </div>
            <Link
              href="/profile/addresses/new"
              className="px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition"
            >
              Add New Address
            </Link>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Addresses List */}
        {addresses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses yet</h3>
            <p className="text-gray-600 mb-6">Add your first delivery address to get started</p>
            <Link
              href="/profile/addresses/new"
              className="inline-block px-6 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition"
            >
              Add Address
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`bg-white rounded-lg shadow-sm p-6 border-2 ${
                  address.is_default ? 'border-orange-500' : 'border-transparent'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{address.address_label}</h3>
                      {address.is_default && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p className="font-medium text-gray-900">{address.recipient_name}</p>
                      <p>{address.phone_number}</p>
                      <p>{address.address_line1}</p>
                      {address.address_line2 && <p>{address.address_line2}</p>}
                      <p>
                        {address.city}, {address.district}
                        {address.postal_code && ` - ${address.postal_code}`}
                      </p>
                      {address.delivery_instructions && (
                        <p className="text-gray-500 italic">
                          Note: {address.delivery_instructions}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2 ml-4">
                    <Link
                      href={`/profile/addresses/${address.id}/edit`}
                      className="px-3 py-1.5 text-sm font-medium text-orange-600 hover:text-orange-700 border border-orange-300 rounded hover:bg-orange-50 transition text-center"
                    >
                      Edit
                    </Link>
                    {!address.is_default && (
                      <button
                        onClick={() => handleSetDefault(address.id)}
                        disabled={isLoading}
                        className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-300 rounded hover:bg-blue-50 transition disabled:opacity-50"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteId(address.id)}
                      className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 border border-red-300 rounded hover:bg-red-50 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Address</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this address? This action cannot be undone.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleDelete(deleteId)}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
                >
                  {isLoading ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => setDeleteId(null)}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 disabled:opacity-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
