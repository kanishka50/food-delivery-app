import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { authApi } from '@/lib/api';

// Helper to set/remove cookie for middleware
const setAuthCookie = (token: string | null) => {
  if (typeof document !== 'undefined') {
    if (token) {
      // Set cookie with 7 day expiry
      document.cookie = `auth-token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    } else {
      // Remove cookie
      document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  }
};

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setAuth: (user: User, token: string) => void;
  logout: () => Promise<void>;
  login: (login: string, password: string) => Promise<void>;

  // OTP Registration Flow
  sendRegistrationOTP: (phoneNumber: string) => Promise<{ success: boolean; message: string; expires_in_seconds?: number; can_resend_in_seconds?: number }>;
  verifyRegistrationOTP: (data: {
    phone_number: string;
    otp_code: string;
    username: string;
    email?: string;
    password: string;
    password_confirmation: string;
    first_name: string;
    last_name: string;
    terms_accepted: boolean;
  }) => Promise<void>;

  // OTP Password Reset Flow
  sendPasswordResetOTP: (phoneNumber: string) => Promise<{ success: boolean; message: string; expires_in_seconds?: number; can_resend_in_seconds?: number }>;
  verifyPasswordResetOTP: (phoneNumber: string, otpCode: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (data: {
    phone_number: string;
    otp_code: string;
    password: string;
    password_confirmation: string;
  }) => Promise<{ success: boolean; message: string }>;

  // Old registration (keep for backward compatibility)
  register: (data: {
    username: string;
    email?: string;
    phone_number: string;
    password: string;
    password_confirmation: string;
    first_name: string;
    last_name: string;
    terms_accepted: boolean;
  }) => Promise<void>;

  fetchProfile: () => Promise<void>;
  updateProfile: (data: { first_name?: string; last_name?: string; email?: string }) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setAuth: (user, token) => {
        localStorage.setItem('token', token);
        setAuthCookie(token);
        set({ user, token, isAuthenticated: true, error: null });
      },

      login: async (login, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login({ login, password });
          const { user, token } = response.data.data;
          localStorage.setItem('token', token);
          setAuthCookie(token);
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (error: unknown) {
          const err = error as { response?: { data?: { message?: string } } };
          set({
            error: err.response?.data?.message || 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      // OTP Registration Flow
      sendRegistrationOTP: async (phoneNumber) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.sendRegistrationOTP({ phone_number: phoneNumber });
          set({ isLoading: false });
          return response.data.data;
        } catch (error: unknown) {
          const err = error as { response?: { data?: { message?: string } } };
          const message = err.response?.data?.message || 'Failed to send OTP';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      verifyRegistrationOTP: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.verifyRegistrationOTP(data);
          const { user, token } = response.data.data;
          localStorage.setItem('token', token);
          setAuthCookie(token);
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (error: unknown) {
          const err = error as { response?: { data?: { message?: string } } };
          set({
            error: err.response?.data?.message || 'OTP verification failed',
            isLoading: false,
          });
          throw error;
        }
      },

      // OTP Password Reset Flow
      sendPasswordResetOTP: async (phoneNumber) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.sendPasswordResetOTP({ phone_number: phoneNumber });
          set({ isLoading: false });
          return response.data.data;
        } catch (error: unknown) {
          const err = error as { response?: { data?: { message?: string } } };
          const message = err.response?.data?.message || 'Failed to send OTP';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      verifyPasswordResetOTP: async (phoneNumber, otpCode) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.verifyPasswordResetOTP({
            phone_number: phoneNumber,
            otp_code: otpCode,
          });
          set({ isLoading: false });
          return response.data.data;
        } catch (error: unknown) {
          const err = error as { response?: { data?: { message?: string } } };
          const message = err.response?.data?.message || 'OTP verification failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      resetPassword: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.resetPassword(data);
          set({ isLoading: false });
          return response.data.data;
        } catch (error: unknown) {
          const err = error as { response?: { data?: { message?: string } } };
          const message = err.response?.data?.message || 'Password reset failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.register(data);
          const { user, token } = response.data.data;
          localStorage.setItem('token', token);
          setAuthCookie(token);
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (error: unknown) {
          const err = error as { response?: { data?: { message?: string } } };
          set({
            error: err.response?.data?.message || 'Registration failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // Ignore logout errors
        } finally {
          localStorage.removeItem('token');
          setAuthCookie(null);
          set({ user: null, token: null, isAuthenticated: false });
        }
      },

      fetchProfile: async () => {
        const { token } = get();
        if (!token) return;

        set({ isLoading: true });
        try {
          const response = await authApi.getProfile();
          set({ user: response.data.data, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },

      updateProfile: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.updateProfile(data);
          set({ user: response.data.data, isLoading: false });
        } catch (error: unknown) {
          const err = error as { response?: { data?: { message?: string } } };
          set({
            error: err.response?.data?.message || 'Update failed',
            isLoading: false,
          });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
