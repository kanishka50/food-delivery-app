'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useAddressStore } from '@/store/addressStore';
import { addressApi } from '@/lib/api';
import { Address } from '@/types';
import Link from 'next/link';

export default function EditAddressPage() {
  const router = useRouter();
  const params = useParams();
  const addressId = Number(params.id);
  const { isAuthenticated } = useAuthStore();
  const { updateAddress, isLoading, error, clearError } = useAddressStore();
  const [address, setAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState({
    address_label: '',
    recipient_name: '',
    phone_number: '',
    address_line1: '',
    address_line2: '',
    city: '',
    district: '',
    postal_code: '',
    delivery_instructions: '',
    is_default: false,
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [loadingAddress, setLoadingAddress] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Fetch the address
    const fetchAddress = async () => {
      try {
        const response = await addressApi.getAddress(addressId);
        const addr = response.data.data;
        setAddress(addr);
        setFormData({
          address_label: addr.address_label,
          recipient_name: addr.recipient_name,
          phone_number: addr.phone_number,
          address_line1: addr.address_line1,
          address_line2: addr.address_line2 || '',
          city: addr.city,
          district: addr.district,
          postal_code: addr.postal_code || '',
          delivery_instructions: addr.delivery_instructions || '',
          is_default: addr.is_default,
        });
      } catch {
        router.push('/profile/addresses');
      } finally {
        setLoadingAddress(false);
      }
    };

    fetchAddress();
  }, [isAuthenticated, router, addressId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    clearError();
    setValidationErrors({});
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const validate = () => {
    const errors: Record<string, string> = {};

    if (!formData.address_label.trim()) {
      errors.address_label = 'Address label is required';
    }

    if (!formData.recipient_name.trim()) {
      errors.recipient_name = 'Recipient name is required';
    }

    if (!formData.phone_number.trim()) {
      errors.phone_number = 'Phone number is required';
    }

    if (!formData.address_line1.trim()) {
      errors.address_line1 = 'Address line 1 is required';
    }

    if (!formData.city.trim()) {
      errors.city = 'City is required';
    }

    if (!formData.district.trim()) {
      errors.district = 'District is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      await updateAddress(addressId, {
        address_label: formData.address_label,
        recipient_name: formData.recipient_name,
        phone_number: formData.phone_number,
        address_line1: formData.address_line1,
        address_line2: formData.address_line2 || undefined,
        city: formData.city,
        district: formData.district,
        postal_code: formData.postal_code || undefined,
        delivery_instructions: formData.delivery_instructions || undefined,
        is_default: formData.is_default,
      });
      router.push('/profile/addresses');
    } catch {
      // Error handled by store
    }
  };

  const sriLankanDistricts = [
    'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
    'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
    'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
    'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
    'Monaragala', 'Ratnapura', 'Kegalle'
  ];

  if (loadingAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!address) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/profile/addresses"
            className="inline-flex items-center text-sm text-orange-600 hover:text-orange-700 mb-4"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Addresses
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Address</h1>
          <p className="mt-2 text-gray-600">Update your delivery address</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Address Label */}
              <div>
                <label htmlFor="address_label" className="block text-sm font-medium text-gray-700 mb-2">
                  Address Label <span className="text-red-500">*</span>
                </label>
                <input
                  id="address_label"
                  name="address_label"
                  type="text"
                  required
                  value={formData.address_label}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    validationErrors.address_label ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Home, Office, Parents' House"
                />
                {validationErrors.address_label && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.address_label}</p>
                )}
              </div>

              {/* Recipient Name */}
              <div>
                <label htmlFor="recipient_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="recipient_name"
                  name="recipient_name"
                  type="text"
                  required
                  value={formData.recipient_name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    validationErrors.recipient_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Full name of the person receiving the order"
                />
                {validationErrors.recipient_name && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.recipient_name}</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone_number"
                  name="phone_number"
                  type="tel"
                  required
                  value={formData.phone_number}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    validationErrors.phone_number ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0771234567"
                />
                {validationErrors.phone_number && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.phone_number}</p>
                )}
              </div>

              {/* Address Line 1 */}
              <div>
                <label htmlFor="address_line1" className="block text-sm font-medium text-gray-700 mb-2">
                  Address Line 1 <span className="text-red-500">*</span>
                </label>
                <input
                  id="address_line1"
                  name="address_line1"
                  type="text"
                  required
                  value={formData.address_line1}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    validationErrors.address_line1 ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="House number, street name"
                />
                {validationErrors.address_line1 && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.address_line1}</p>
                )}
              </div>

              {/* Address Line 2 */}
              <div>
                <label htmlFor="address_line2" className="block text-sm font-medium text-gray-700 mb-2">
                  Address Line 2 <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <input
                  id="address_line2"
                  name="address_line2"
                  type="text"
                  value={formData.address_line2}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Apartment, suite, building, floor, etc."
                />
              </div>

              {/* City and District */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      validationErrors.city ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Colombo"
                  />
                  {validationErrors.city && (
                    <p className="mt-1 text-sm text-red-500">{validationErrors.city}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-2">
                    District <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="district"
                    name="district"
                    required
                    value={formData.district}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      validationErrors.district ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select District</option>
                    {sriLankanDistricts.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                  {validationErrors.district && (
                    <p className="mt-1 text-sm text-red-500">{validationErrors.district}</p>
                  )}
                </div>
              </div>

              {/* Postal Code */}
              <div>
                <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <input
                  id="postal_code"
                  name="postal_code"
                  type="text"
                  value={formData.postal_code}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., 10100"
                />
              </div>

              {/* Delivery Instructions */}
              <div>
                <label htmlFor="delivery_instructions" className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Instructions <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <textarea
                  id="delivery_instructions"
                  name="delivery_instructions"
                  rows={3}
                  value={formData.delivery_instructions}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Any special instructions for delivery (e.g., gate code, landmarks)"
                />
              </div>

              {/* Set as Default */}
              <div className="flex items-center">
                <input
                  id="is_default"
                  name="is_default"
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={handleChange}
                  className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="is_default" className="ml-2 block text-sm text-gray-700">
                  Set as default address
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {isLoading ? 'Updating...' : 'Update Address'}
                </button>
                <Link
                  href="/profile/addresses"
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition text-center"
                >
                  Cancel
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
