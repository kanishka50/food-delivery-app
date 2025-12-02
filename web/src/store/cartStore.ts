import { create } from 'zustand';
import { Cart } from '@/types';
import { cartApi } from '@/lib/api';

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCart: () => Promise<void>;
  addItem: (foodItemId: number, quantity: number, variationId?: number, instructions?: string) => Promise<void>;
  updateItem: (itemId: number, quantity: number, instructions?: string) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  applyPromoCode: (code: string) => Promise<void>;
  removePromoCode: () => Promise<void>;
  clearError: () => void;
}

export const useCartStore = create<CartState>()((set) => ({
  cart: null,
  isLoading: false,
  error: null,

  fetchCart: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await cartApi.getCart();
      set({ cart: response.data.data, isLoading: false });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({
        error: err.response?.data?.message || 'Failed to fetch cart',
        isLoading: false,
      });
    }
  },

  addItem: async (foodItemId, quantity, variationId, instructions) => {
    set({ isLoading: true, error: null });
    try {
      const response = await cartApi.addItem({
        food_item_id: foodItemId,
        quantity,
        variation_id: variationId,
        special_instructions: instructions,
      });
      set({ cart: response.data.data, isLoading: false });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({
        error: err.response?.data?.message || 'Failed to add item',
        isLoading: false,
      });
      throw error;
    }
  },

  updateItem: async (itemId, quantity, instructions) => {
    set({ isLoading: true, error: null });
    try {
      const response = await cartApi.updateItem(itemId, {
        quantity,
        special_instructions: instructions,
      });
      set({ cart: response.data.data, isLoading: false });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({
        error: err.response?.data?.message || 'Failed to update item',
        isLoading: false,
      });
      throw error;
    }
  },

  removeItem: async (itemId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await cartApi.removeItem(itemId);
      set({ cart: response.data.data, isLoading: false });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({
        error: err.response?.data?.message || 'Failed to remove item',
        isLoading: false,
      });
      throw error;
    }
  },

  clearCart: async () => {
    set({ isLoading: true, error: null });
    try {
      await cartApi.clearCart();
      set({ cart: null, isLoading: false });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({
        error: err.response?.data?.message || 'Failed to clear cart',
        isLoading: false,
      });
      throw error;
    }
  },

  applyPromoCode: async (code) => {
    set({ isLoading: true, error: null });
    try {
      const response = await cartApi.applyPromoCode(code);
      set({ cart: response.data.data, isLoading: false });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({
        error: err.response?.data?.message || 'Invalid promo code',
        isLoading: false,
      });
      throw error;
    }
  },

  removePromoCode: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await cartApi.removePromoCode();
      set({ cart: response.data.data, isLoading: false });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({
        error: err.response?.data?.message || 'Failed to remove promo code',
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
