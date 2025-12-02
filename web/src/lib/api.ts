import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data on unauthorized
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Optionally redirect to login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  // OTP Registration Flow
  sendRegistrationOTP: (data: { phone_number: string }) =>
    api.post('/auth/send-registration-otp', data),

  verifyRegistrationOTP: (data: {
    phone_number: string;
    otp_code: string;
    username: string;
    email?: string; // Email is optional
    password: string;
    password_confirmation: string;
    first_name: string;
    last_name: string;
    terms_accepted: boolean;
  }) => api.post('/auth/verify-registration-otp', data),

  // Login with phone number or username (NOT email)
  login: (data: { login: string; password: string }) =>
    api.post('/auth/login', data),

  // Password Reset Flow with OTP
  sendPasswordResetOTP: (data: { phone_number: string }) =>
    api.post('/auth/send-password-reset-otp', data),

  verifyPasswordResetOTP: (data: { phone_number: string; otp_code: string }) =>
    api.post('/auth/verify-password-reset-otp', data),

  resetPassword: (data: {
    phone_number: string;
    otp_code: string;
    password: string;
    password_confirmation: string;
  }) => api.post('/auth/reset-password', data),

  // Profile & Account Management
  logout: () => api.post('/auth/logout'),

  getProfile: () => api.get('/auth/profile'),

  updateProfile: (data: {
    first_name?: string;
    last_name?: string;
    email?: string; // Can add/update email in profile
  }) => api.put('/auth/profile', data),

  changePassword: (data: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) => api.post('/auth/change-password', data),

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
  }) => api.post('/auth/register', data),
};

// Menu API
export const menuApi = {
  getCategories: () => api.get('/categories'),

  getCategoryItems: (slug: string, branchId?: number) =>
    api.get(`/categories/${slug}`, { params: branchId ? { branch_id: branchId } : {} }),

  getItems: (params?: {
    category_id?: number;
    is_vegetarian?: boolean;
    spicy_level?: number;
    sort_by?: string;
    sort_dir?: string;
    per_page?: number;
    page?: number;
    branch_id?: number;
  }) => api.get('/items', { params }),

  getFeaturedItems: (branchId?: number) =>
    api.get('/items/featured', { params: branchId ? { branch_id: branchId } : {} }),

  searchItems: (query: string, branchId?: number) =>
    api.get('/items/search', { params: { q: query, ...(branchId ? { branch_id: branchId } : {}) } }),

  getItemDetail: (slug: string, branchId?: number) =>
    api.get(`/items/${slug}`, { params: branchId ? { branch_id: branchId } : {} }),

  // Validate cart items availability at a branch
  validateCart: (branchId: number, items: { variation_id: number; quantity: number }[]) =>
    api.post('/menu/validate-cart', { branch_id: branchId, items }),
};

// Branch API
export const branchApi = {
  getBranches: (params?: { latitude?: number; longitude?: number }) =>
    api.get('/branches', { params }),

  getNearestBranch: (latitude: number, longitude: number) =>
    api.get('/branches/nearest', { params: { latitude, longitude } }),
};

// Address API
export const addressApi = {
  getAddresses: () => api.get('/addresses'),

  getAddress: (id: number) => api.get(`/addresses/${id}`),

  createAddress: (data: {
    address_label: string;
    recipient_name: string;
    phone_number: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    district: string;
    postal_code?: string;
    latitude?: number;
    longitude?: number;
    delivery_instructions?: string;
    is_default?: boolean;
  }) => api.post('/addresses', data),

  updateAddress: (id: number, data: Partial<Parameters<typeof addressApi.createAddress>[0]>) =>
    api.put(`/addresses/${id}`, data),

  deleteAddress: (id: number) => api.delete(`/addresses/${id}`),

  setDefaultAddress: (id: number) => api.post(`/addresses/${id}/default`),
};

// Cart API
export const cartApi = {
  getCart: () => api.get('/cart'),

  addItem: (data: {
    food_item_id: number;
    variation_id?: number;
    quantity: number;
    special_instructions?: string;
  }) => api.post('/cart/items', data),

  updateItem: (itemId: number, data: {
    quantity: number;
    special_instructions?: string;
  }) => api.put(`/cart/items/${itemId}`, data),

  removeItem: (itemId: number) => api.delete(`/cart/items/${itemId}`),

  clearCart: () => api.delete('/cart'),

  applyPromoCode: (code: string) => api.post('/cart/promo-code', { promo_code: code }),

  removePromoCode: () => api.delete('/cart/promo-code'),
};

export default api;
