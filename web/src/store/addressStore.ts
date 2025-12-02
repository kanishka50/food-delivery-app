import { create } from 'zustand';
import { addressApi } from '@/lib/api';
import { Address } from '@/types';

interface AddressState {
  addresses: Address[];
  isLoading: boolean;
  error: string | null;
  fetchAddresses: () => Promise<void>;
  createAddress: (data: Omit<Address, 'id' | 'is_default'> & { is_default?: boolean }) => Promise<Address>;
  updateAddress: (id: number, data: Partial<Omit<Address, 'id'>>) => Promise<Address>;
  deleteAddress: (id: number) => Promise<void>;
  setDefaultAddress: (id: number) => Promise<void>;
  clearError: () => void;
}

export const useAddressStore = create<AddressState>((set, get) => ({
  addresses: [],
  isLoading: false,
  error: null,

  fetchAddresses: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await addressApi.getAddresses();
      set({ addresses: response.data.data, isLoading: false });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({
        error: err.response?.data?.message || 'Failed to fetch addresses',
        isLoading: false,
      });
    }
  },

  createAddress: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await addressApi.createAddress(data);
      await get().fetchAddresses(); // Refresh list
      set({ isLoading: false });
      return response.data.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({
        error: err.response?.data?.message || 'Failed to create address',
        isLoading: false,
      });
      throw error;
    }
  },

  updateAddress: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await addressApi.updateAddress(id, data);
      await get().fetchAddresses(); // Refresh list
      set({ isLoading: false });
      return response.data.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({
        error: err.response?.data?.message || 'Failed to update address',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteAddress: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await addressApi.deleteAddress(id);
      await get().fetchAddresses(); // Refresh list
      set({ isLoading: false });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({
        error: err.response?.data?.message || 'Failed to delete address',
        isLoading: false,
      });
      throw error;
    }
  },

  setDefaultAddress: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await addressApi.setDefaultAddress(id);
      await get().fetchAddresses(); // Refresh list
      set({ isLoading: false });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({
        error: err.response?.data?.message || 'Failed to set default address',
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
