// User types
export interface User {
  id: number;
  username: string;
  email: string | null;
  phone_number: string;
  first_name: string;
  last_name: string;
  name: string;
  profile_image: string | null;
  is_phone_verified: boolean;
  created_at?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
    token_type: string;
  };
}

// Category types
export interface Category {
  id: number;
  category_name: string;
  category_slug: string;
  description: string | null;
  image: string | null;
}

// Alias for consistency
export type FoodCategory = Category;

// Price range type for when no branch is selected
export interface PriceRange {
  min: number;
  max: number;
}

// Food Item Variation types
export interface FoodItemVariation {
  id: number;
  name: string;
  default_price: number;
  effective_price: number;
  is_default: boolean;

  // Branch-specific fields (when branch_id is provided)
  is_available_at_branch?: boolean;
  branch_price?: number | null;

  // Price range (when no branch_id - shows price across all branches)
  price_range?: PriceRange | null;
}

export interface FoodItem {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  starting_price: number;
  image: string | null;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_spicy: boolean;
  spicy_level: number;
  is_featured: boolean;
  average_rating: number;
  total_ratings: number;
  category: {
    id: number;
    name: string;
    slug: string;
  } | null;
  variations: FoodItemVariation[];

  // Branch availability (when branch_id is provided)
  is_available_at_branch?: boolean | null;
  unavailable_message?: string | null;

  // Price range across all branches (when no branch_id)
  price_range?: PriceRange | null;

  // Detailed fields
  ingredients?: string;
  preparation_time_minutes?: number;
}

// Branch types
export interface Branch {
  id: number;
  branch_code: string;
  branch_name: string;
  slug: string;
  address: string;
  city: string;
  phone_number: string;
  latitude: number;
  longitude: number;
  delivery_radius_km: number;
  opening_time: string;
  closing_time: string;
  is_open_now: boolean;
  distance_km?: number;
}

// Address types
export interface Address {
  id: number;
  address_label: string;
  recipient_name: string;
  phone_number: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  district: string;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  delivery_instructions: string | null;
  is_default: boolean;
}

// Cart types
export interface CartItem {
  id: number;
  food_item: {
    id: number;
    name: string;
    slug: string;
    image: string | null;
  };
  variation: {
    id: number;
    size_name: string;
  } | null;
  quantity: number;
  unit_price: number;
  total: number;
  special_instructions: string | null;
}

export interface Cart {
  id: number;
  items: CartItem[];
  item_count: number;
  subtotal: number;
  delivery_fee: number;
  tax_amount: number;
  discount_amount: number;
  promo_code: {
    code: string;
    discount_type: string;
    discount_value: number;
  } | null;
  total: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  };
}
