'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import OTPInput from '@/components/auth/OTPInput';

type RegistrationStep = 'phone' | 'otp' | 'details';

export default function RegisterPage() {
  const router = useRouter();
  const { sendRegistrationOTP, verifyRegistrationOTP, isLoading, error, clearError } = useAuthStore();

  const [step, setStep] = useState<RegistrationStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpExpiry, setOtpExpiry] = useState<number>(0);
  const [canResendIn, setCanResendIn] = useState<number>(0);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    password_confirmation: '',
    terms_accepted: false,
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const numbers = value.replace(/[^0-9]/g, '');

    // Format as +94 77 123 4567
    if (numbers.length === 0) return '';
    if (numbers.startsWith('94')) {
      const number = numbers.slice(2);
      if (number.length <= 2) return `+94 ${number}`;
      if (number.length <= 5) return `+94 ${number.slice(0, 2)} ${number.slice(2)}`;
      return `+94 ${number.slice(0, 2)} ${number.slice(2, 5)} ${number.slice(5, 9)}`;
    } else if (numbers.startsWith('0')) {
      const number = numbers.slice(1);
      if (number.length <= 2) return `+94 ${number}`;
      if (number.length <= 5) return `+94 ${number.slice(0, 2)} ${number.slice(2)}`;
      return `+94 ${number.slice(0, 2)} ${number.slice(2, 5)} ${number.slice(5, 9)}`;
    } else {
      if (numbers.length <= 2) return `+94 ${numbers}`;
      if (numbers.length <= 5) return `+94 ${numbers.slice(0, 2)} ${numbers.slice(2)}`;
      return `+94 ${numbers.slice(0, 2)} ${numbers.slice(2, 5)} ${numbers.slice(5, 9)}`;
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Extract just the numbers for API
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');

    if (cleanPhone.length < 9) {
      return;
    }

    try {
      const result = await sendRegistrationOTP(cleanPhone);
      if (result.success) {
        setOtpExpiry(result.expires_in_seconds || 300);
        setCanResendIn(result.can_resend_in_seconds || 60);
        setStep('otp');
      }
    } catch {
      // Error handled by store
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (otp.length !== 6) {
      return;
    }

    setStep('details');
  };

  const handleResendOTP = async () => {
    if (canResendIn > 0) return;

    clearError();
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');

    try {
      const result = await sendRegistrationOTP(cleanPhone);
      if (result.success) {
        setOtp('');
        setOtpExpiry(result.expires_in_seconds || 300);
        setCanResendIn(result.can_resend_in_seconds || 60);
      }
    } catch {
      // Error handled by store
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    clearError();
    setValidationErrors({});
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const validate = () => {
    const errors: Record<string, string> = {};

    if (formData.password !== formData.password_confirmation) {
      errors.password_confirmation = 'Passwords do not match';
    }

    if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (!formData.terms_accepted) {
      errors.terms_accepted = 'You must accept the terms and conditions';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');

    try {
      await verifyRegistrationOTP({
        phone_number: cleanPhone,
        otp_code: otp,
        username: formData.username,
        email: formData.email || undefined,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        first_name: formData.first_name,
        last_name: formData.last_name,
        terms_accepted: formData.terms_accepted,
      });
      router.push('/');
    } catch {
      // If OTP is invalid, go back to OTP step
      setStep('otp');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-2xl">F</span>
            </div>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Create an account</h2>
          <p className="mt-2 text-gray-600">
            {step === 'phone' && 'Enter your phone number to get started'}
            {step === 'otp' && 'Verify your phone number'}
            {step === 'details' && 'Complete your profile'}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step === 'phone' ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'
          }`}>
            {step === 'phone' ? '1' : '✓'}
          </div>
          <div className={`h-1 w-12 ${step === 'phone' ? 'bg-gray-300' : 'bg-orange-500'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step === 'phone' ? 'bg-gray-300 text-gray-600' :
            step === 'otp' ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'
          }`}>
            {step === 'details' ? '✓' : '2'}
          </div>
          <div className={`h-1 w-12 ${step === 'details' ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step === 'details' ? 'bg-orange-500 text-white' : 'bg-gray-300 text-gray-600'
          }`}>
            3
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Phone Number */}
        {step === 'phone' && (
          <form className="mt-8 space-y-6" onSubmit={handlePhoneSubmit}>
            <div>
              <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                id="phone_number"
                name="phone_number"
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="+94 77 123 4567"
              />
              <p className="mt-1 text-xs text-gray-500">
                We'll send you a verification code via SMS
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || phoneNumber.replace(/[^0-9]/g, '').length < 9}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isLoading ? 'Sending...' : 'Send verification code'}
            </button>

            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-orange-500 hover:text-orange-600 font-medium">
                Sign in
              </Link>
            </p>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 'otp' && (
          <form className="mt-8 space-y-6" onSubmit={handleOTPSubmit}>
            <div>
              <p className="text-center text-sm text-gray-600 mb-4">
                Enter the 6-digit code sent to<br />
                <span className="font-semibold text-gray-900">{phoneNumber}</span>
              </p>

              <OTPInput
                value={otp}
                onChange={setOtp}
                error={!!error}
                disabled={isLoading}
              />

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={canResendIn > 0 || isLoading}
                  className="text-sm text-orange-500 hover:text-orange-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {canResendIn > 0 ? `Resend code in ${canResendIn}s` : 'Resend code'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="ml-4 text-sm text-gray-600 hover:text-gray-900"
                >
                  Change number
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isLoading ? 'Verifying...' : 'Verify & Continue'}
            </button>
          </form>
        )}

        {/* Step 3: User Details */}
        {step === 'details' && (
          <form className="mt-8 space-y-6" onSubmit={handleDetailsSubmit}>
            <div className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={handleChange}
                    className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={handleChange}
                    className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Last name"
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Choose a username"
                />
              </div>

              {/* Email (Optional) */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="your.email@example.com"
                />
                <p className="mt-1 text-xs text-gray-500">
                  For order receipts and notifications
                </p>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`appearance-none relative block w-full px-4 py-3 border placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    validationErrors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Create a password"
                />
                {validationErrors.password && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  id="password_confirmation"
                  name="password_confirmation"
                  type="password"
                  required
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  className={`appearance-none relative block w-full px-4 py-3 border placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    validationErrors.password_confirmation ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Confirm your password"
                />
                {validationErrors.password_confirmation && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.password_confirmation}</p>
                )}
              </div>

              {/* Terms */}
              <div>
                <div className="flex items-start">
                  <input
                    id="terms_accepted"
                    name="terms_accepted"
                    type="checkbox"
                    checked={formData.terms_accepted}
                    onChange={handleChange}
                    className={`h-4 w-4 text-orange-500 focus:ring-orange-500 rounded mt-1 ${
                      validationErrors.terms_accepted ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <label htmlFor="terms_accepted" className="ml-2 block text-sm text-gray-700">
                    I agree to the{' '}
                    <Link href="/terms" className="text-orange-500 hover:text-orange-600">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-orange-500 hover:text-orange-600">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
                {validationErrors.terms_accepted && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.terms_accepted}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                'Create account'
              )}
            </button>

            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-orange-500 hover:text-orange-600 font-medium">
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
