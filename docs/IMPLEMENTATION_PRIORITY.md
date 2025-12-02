# Food Delivery System - Implementation Priority List

## Overview
This document outlines the implementation order for the Food Delivery System.
- **Approach**: Data insertion (Admin) first, then data retrieval (Customer/Rider)
- **Initial Admin**: Single Super Admin with full permissions
- **Future**: Role-based admin access can be added later

---

## PHASE 1: ADMIN AUTHENTICATION & CORE SETUP

### 1.1 Super Admin Authentication
**Database Tables**: `users`, `admin_roles`, `personal_access_tokens`

| # | Feature | Type | Description |
|---|---------|------|-------------|
| 1 | Admin Login | CREATE | Filament login with email/password |
| 2 | Admin Dashboard | READ | Basic dashboard with welcome message |
| 3 | Admin Profile | UPDATE | Update own profile, change password |
| 4 | Session Management | READ | View active sessions |

**Default Super Admin**:
- Email: admin@fooddelivery.lk
- Password: password (change on first login)
- Role: super_admin (all permissions)

---

## PHASE 2: ADMIN DATA MANAGEMENT (CRUD Operations)

### 2.1 Branch Management
**Database Tables**: `branches`

| # | Feature | Type | Description |
|---|---------|------|-------------|
| 1 | Create Branch | CREATE | Add new branch with name, address, GPS coordinates |
| 2 | Set Delivery Radius | CREATE | Configure delivery radius in KM per branch |
| 3 | Set Operating Hours | CREATE | Opening/closing time, per-day schedule |
| 4 | List Branches | READ | View all branches with status |
| 5 | View Branch Details | READ | Single branch details with map preview |
| 6 | Edit Branch | UPDATE | Modify branch information |
| 7 | Activate/Deactivate | UPDATE | Toggle branch active status |
| 8 | Delete Branch | DELETE | Soft delete branch |

**Fields**:
- branch_name, branch_code, branch_slug
- address, city, district
- latitude, longitude, delivery_radius_km
- contact_number, email
- opening_time, closing_time
- is_open_sunday through is_open_saturday
- is_active

---

### 2.2 Category Management
**Database Tables**: `food_categories`

| # | Feature | Type | Description |
|---|---------|------|-------------|
| 1 | Create Category | CREATE | Add food category (Pizza, Burgers, etc.) |
| 2 | Upload Category Image | CREATE | Category display image |
| 3 | Set Display Order | CREATE | Sort order for menu display |
| 4 | List Categories | READ | View all categories |
| 5 | Edit Category | UPDATE | Modify category details |
| 6 | Reorder Categories | UPDATE | Change display order (drag & drop) |
| 7 | Activate/Deactivate | UPDATE | Toggle category visibility |
| 8 | Delete Category | DELETE | Soft delete (only if no items) |

**Fields**:
- category_name, category_slug
- description, image
- display_order, is_active

---

### 2.3 Menu Item Management (Variant-Based Pricing System)
**Database Tables**: `food_items`, `item_variations`, `branch_variation_availability`

**Pricing Strategy** (Updated 2025-11-26):
- **ALL items MUST have at least ONE variant** (if no sizes/options, create "Standard" variant)
- **Prices stored ONLY in `item_variations.price`** (one system-wide price per variant)
- **Branch availability controlled at VARIANT level** (each branch enables/disables specific variants)
- **NO base_price used** - `food_items.base_price` column ignored/deprecated
- **Old `branch_menu_availability` table deprecated** - use `branch_variation_availability` instead

| # | Feature | Type | Description |
|---|---------|------|-------------|
| 1 | Create Food Item | CREATE | Add item with name, description (NO price field) |
| 2 | Assign to Category | CREATE | Link item to food category |
| 3 | Upload Item Image | CREATE | Product image |
| 4 | Add Variations | CREATE | Add variants with prices (mandatory - at least one "Standard") |
| 5 | Set Variant Prices | CREATE | System-wide price per variant |
| 6 | Assign Variants to Branches | CREATE | Control which variants available at each branch |
| 7 | List Menu Items | READ | View all items with filters |
| 8 | View Item Details | READ | Full item details with variations |
| 9 | Edit Item | UPDATE | Modify item information (except pricing) |
| 10 | Edit Variant Prices | UPDATE | Change variant prices (affects all branches) |
| 11 | Toggle Variant Availability | UPDATE | Enable/disable variants per branch |
| 12 | Delete Item | DELETE | Soft delete item |

**Fields - Food Items**:
- item_name, item_slug, category_id
- description, ingredients, image
- ~~base_price~~ (deprecated - not used in new system)
- has_variations (always true with new system)
- is_vegetarian, is_vegan, is_spicy, spicy_level
- preparation_time_minutes, display_order
- is_available, is_active

**Fields - Variations** (`item_variations`):
- variation_name (Small, Medium, Large, Standard)
- **price** (system-wide price for this variant)
- is_default, is_available, display_order

**Fields - Branch Variation Availability** (`branch_variation_availability`):
- branch_id, variation_id
- **is_available** (controls if this variant is offered at this branch)

---

### 2.4 System Settings (Pricing Configuration)
**Database Tables**: `system_settings`

| # | Feature | Type | Description |
|---|---------|------|-------------|
| 1 | Set Service Fee % | CREATE/UPDATE | Service fee percentage (default: 10%) |
| 2 | Set Delivery Rate | CREATE/UPDATE | Rate per KM in LKR (default: 50) |
| 3 | Set Minimum Order | CREATE/UPDATE | Minimum order amount |
| 4 | Set Support Hotline | CREATE/UPDATE | Customer support number |
| 5 | Set Support Email | CREATE/UPDATE | Support email address |
| 6 | View All Settings | READ | List all configurable settings |

**Default Settings**:
- service_fee_percentage: 10%
- delivery_rate_per_km: LKR 50
- minimum_order_amount: LKR 500
- support_hotline: +94771234567
- currency: LKR

---

### 2.5 Offers & Promotions Management
**Database Tables**: `offers`, `offer_items`, `offer_categories`, `promo_codes`

| # | Feature | Type | Description |
|---|---------|------|-------------|
| 1 | Create Offer | CREATE | Automatic discount offer |
| 2 | Set Discount Type | CREATE | Percentage or fixed amount |
| 3 | Assign to Items | CREATE | Link offer to specific items |
| 4 | Assign to Categories | CREATE | Link offer to categories |
| 5 | Set Validity Period | CREATE | Start and end date |
| 6 | Create Promo Code | CREATE | User-entered discount codes |
| 7 | Set Usage Limits | CREATE | Total and per-user limits |
| 8 | List Offers | READ | View all offers |
| 9 | View Offer Usage | READ | Track how many times used |
| 10 | Edit Offer | UPDATE | Modify offer details |
| 11 | Activate/Deactivate | UPDATE | Toggle offer status |
| 12 | Delete Offer | DELETE | Remove offer |

**Fields - Offers**:
- offer_name, offer_slug, description
- discount_type (percentage/fixed_amount)
- discount_value, minimum_order_amount, maximum_discount_amount
- applicable_to (all_items/specific_items/specific_categories)
- branch_id (null = all branches)
- start_date, end_date, usage_limit
- image, is_featured, is_active

---

## PHASE 3: CUSTOMER AUTHENTICATION & FEATURES

### 3.1 Customer Authentication
**Database Tables**: `users`, `otp_verifications`, `personal_access_tokens`

**Authentication Flow**: All authentication uses SMS OTP (via Notify.lk) - NO email verification

| # | Feature | Type | Description |
|---|---------|------|-------------|
| 1 | Customer Registration | CREATE | Register with phone (mandatory), email (optional) |
| 2 | Send Registration OTP | CREATE | Send SMS OTP via Notify.lk for phone verification |
| 3 | Verify Registration OTP | UPDATE | Verify phone number and activate account |
| 4 | Set Password | CREATE | Create username and password after OTP verification |
| 5 | Customer Login | READ | Login with username/email/phone + password |
| 6 | Forgot Password (OTP) | CREATE | Request password reset via SMS OTP |
| 7 | Verify Reset OTP | UPDATE | Verify OTP code sent to phone |
| 8 | Reset Password | UPDATE | Set new password after OTP verification |
| 9 | View Profile | READ | Customer profile details |
| 10 | Update Profile | UPDATE | Edit name, email, etc. |
| 11 | Change Password | UPDATE | Change password (authenticated users) |
| 12 | Logout | DELETE | Invalidate session token |

**API Endpoints**:
- POST /api/auth/register (send OTP to phone)
- POST /api/auth/verify-otp (verify registration OTP)
- POST /api/auth/login
- POST /api/auth/forgot-password (send reset OTP)
- POST /api/auth/verify-reset-otp (verify reset OTP)
- POST /api/auth/reset-password (requires verified OTP)
- GET /api/auth/profile
- PUT /api/auth/profile
- POST /api/auth/change-password
- POST /api/auth/logout

**SMS OTP Implementation Details**:
- OTP Length: 6 digits
- OTP Validity: 5 minutes
- Max Attempts: 3 attempts per OTP
- Resend Cooldown: 60 seconds
- SMS Provider: Notify.lk
- Use Cases: Registration, Password Reset, Phone Number Change

---

### 3.2 Customer Address Management
**Database Tables**: `customer_addresses`, `orders` (for temporary addresses)

**Address Storage Strategy**:
- **Saved Addresses**: Stored in `customer_addresses` table (optional, user choice)
- **One-Time Addresses**: Stored in `orders.delivery_address_json` (not saved for reuse)
- **Current Location**: Stored in browser sessionStorage (temporary, cleared on tab close)

| # | Feature | Type | Description |
|---|---------|------|-------------|
| 1 | Add Saved Address | CREATE | Save delivery address (optional, user checkbox) |
| 2 | Auto-Geocode Address | CREATE | Convert address to lat/long via Google API |
| 3 | Set Address Label | CREATE | Home, Office, Friend's Place, etc. |
| 4 | List Saved Addresses | READ | View all user-saved addresses |
| 5 | Get Default Address | READ | Retrieve default saved address |
| 6 | Edit Saved Address | UPDATE | Modify address details, re-geocode if changed |
| 7 | Set as Default | UPDATE | Mark address as default |
| 8 | Delete Saved Address | DELETE | Remove saved address |

**Address Fields**:
- `address_label` - User-defined label (e.g., "Home", "Office")
- `recipient_name` - Person receiving the order
- `phone_number` - Contact number for delivery
- `address_line1` - Street address (required, manually entered)
- `address_line2` - Apartment/Building/Floor (optional, manually entered)
- `city` - City name (required, manually entered)
- `district` - Sri Lankan district (required, dropdown selection)
- `postal_code` - Postal code (optional, manually entered)
- `latitude`, `longitude` - Auto-calculated via geocoding (not user input)
- `delivery_instructions` - Special delivery notes (optional)
- `is_default` - Default address flag

**Important Notes**:
- Users do NOT manually enter lat/long - it's auto-calculated from their address
- Postal code is NOT required for geocoding to work
- Google Maps Geocoding API handles: "Street, City, District, Sri Lanka" → lat/long

**API Endpoints**:
- POST /api/addresses (creates saved address, geocodes automatically)
- GET /api/addresses (list saved addresses)
- GET /api/addresses/{id}
- PUT /api/addresses/{id} (updates and re-geocodes if address changed)
- PUT /api/addresses/{id}/default
- DELETE /api/addresses/{id}

---

### 3.3 Location & Branch Detection
**Database Tables**: `branches`

**Location Tracking Strategy**:
- **Browser GPS**: Get location via JavaScript Geolocation API
- **Storage**: Browser sessionStorage ONLY (temporary, privacy-friendly)
- **Backend**: GPS sent to backend only when needed (find branch, place order)
- **Database**: NO permanent GPS storage in users table
- **Orders**: Location saved in orders table only when order is placed

| # | Feature | Type | Description |
|---|---------|------|-------------|
| 1 | Request GPS Permission | READ | Browser asks user for location access |
| 2 | Get Current Location | READ | Retrieve lat/long from browser |
| 3 | Store in SessionStorage | CREATE | Temporary browser storage (cleared on tab close) |
| 4 | Find Nearest Branch | READ | Calculate distance to all branches |
| 5 | Check Delivery Radius | READ | Verify if within delivery area |
| 6 | Get Branch Menu | READ | Return menu for serving branch |
| 7 | Show Unavailable Message | READ | Display if outside delivery area |
| 8 | Geocode Manual Address | CREATE | Convert typed address to lat/long (Google API) |

**Location Flow**:
```
User Opens App → Request GPS → Store in sessionStorage
                                      ↓
                              Find Nearest Branch
                                      ↓
                              Show Branch Menu
                                      ↓
User Browses & Adds to Cart (location stays in browser)
                                      ↓
Checkout: "Use Current Location" OR "Enter Different Address"
                                      ↓
Place Order → Save address in orders table (permanent)
            → Optional: Save to customer_addresses (if checkbox checked)
```

**API Endpoints**:
- POST /api/branches/nearest (body: latitude, longitude)
- GET /api/branches (optional params: latitude, longitude for distance calc)
- GET /api/branches/{id}/menu
- POST /api/geocode/address (body: address_line1, city, district, country)

---

### 3.4 Menu Display (Customer View)
**Database Tables**: `food_categories`, `food_items`, `item_variations`, `branch_menu_availability`, `offers`

| # | Feature | Type | Description |
|---|---------|------|-------------|
| 1 | List Categories | READ | Get all active categories |
| 2 | List Items by Category | READ | Items for selected category |
| 3 | View Item Details | READ | Full item with variations |
| 4 | Search Items | READ | Full-text search by name |
| 5 | Filter Items | READ | By vegetarian, spicy, etc. |
| 6 | View Active Offers | READ | Current promotions |
| 7 | Get Popular Items | READ | Most ordered items |

**API Endpoints**:
- GET /api/categories
- GET /api/categories/{slug}/items
- GET /api/items/{slug}
- GET /api/items/search?q={query}
- GET /api/items/popular
- GET /api/offers

---

### 3.5 Shopping Cart
**Database Tables**: `shopping_carts`, `cart_items`

| # | Feature | Type | Description |
|---|---------|------|-------------|
| 1 | Add to Cart | CREATE | Add item with quantity, variation |
| 2 | Add Special Instructions | CREATE | Notes for item preparation |
| 3 | View Cart | READ | List all cart items |
| 4 | Calculate Totals | READ | Subtotal, fees, delivery, total |
| 5 | Update Quantity | UPDATE | Change item quantity |
| 6 | Remove Item | DELETE | Remove from cart |
| 7 | Clear Cart | DELETE | Empty entire cart |

**API Endpoints**:
- POST /api/cart/items
- GET /api/cart
- PUT /api/cart/items/{id}
- DELETE /api/cart/items/{id}
- DELETE /api/cart

---

### 3.6 Checkout & Order Placement
**Database Tables**: `orders`, `order_items`, `customer_addresses` (optional)

**Checkout Address Options**:
1. **Use Current Location** (90% of orders) - GPS from sessionStorage
2. **Use Saved Address** - Select from `customer_addresses` table
3. **Enter New Address** - Manual entry, optional save

| # | Feature | Type | Description |
|---|---------|------|-------------|
| 1 | Get Current Location | READ | Retrieve GPS from sessionStorage |
| 2 | Select from Saved Addresses | READ | Choose from user's saved addresses |
| 3 | Enter New Address | CREATE | Manual address entry (one-time or save) |
| 4 | Geocode New Address | CREATE | Convert typed address to lat/long |
| 5 | Validate Delivery Radius | READ | Check if address within branch radius |
| 6 | Add Building/Unit Details | CREATE | Apartment, floor, building name |
| 7 | Optional: Save Address | CREATE | Checkbox to save for future use |
| 8 | Calculate Delivery Fee | READ | Based on distance to branch |
| 9 | Apply Offer/Promo Code | READ | Validate and apply discount |
| 10 | Add Rider Tip | CREATE | Optional tip amount |
| 11 | Select Payment Method | CREATE | Online or Cash on Delivery |
| 12 | Place Order | CREATE | Create order with all details |
| 13 | Store Address in Order | CREATE | Save to `orders.delivery_address_json` OR reference `customer_address_id` |
| 14 | Generate Verification Code | CREATE | 4-digit delivery code |
| 15 | Order Confirmation | READ | Return order details |

**Order Address Storage Logic**:
- If user selected "Save this address":
  - Create entry in `customer_addresses` table
  - Order references: `customer_address_id`
- If user did NOT save:
  - Store address in `orders.delivery_address_json` (JSON column)
  - No entry in `customer_addresses` table

**delivery_address_json Example**:
```json
{
  "type": "current_location",
  "latitude": 6.8565,
  "longitude": 79.8821,
  "address_line1": "Building Name, Street",
  "address_line2": "Floor 3, Apartment 5A",
  "city": "Dehiwala",
  "district": "Colombo",
  "postal_code": "10350",
  "phone_number": "0771234567",
  "recipient_name": "John Doe",
  "delivery_instructions": "Ring bell twice",
  "captured_at": "2025-11-26T10:30:00Z"
}
```

**API Endpoints**:
- POST /api/geocode/address (geocode manual address)
- POST /api/orders/validate-address (check delivery radius)
- POST /api/orders/calculate (preview totals)
- POST /api/orders (place order - body includes save_address boolean)
- POST /api/orders/apply-promo
- GET /api/orders/{id}/confirmation

---

### 3.7 Payment Integration
**Database Tables**: `orders`, `payment_transactions`

| # | Feature | Type | Description |
|---|---------|------|-------------|
| 1 | Initiate PayHere Payment | CREATE | Generate payment request |
| 2 | Payment Success Callback | UPDATE | Handle successful payment |
| 3 | Payment Failed Callback | UPDATE | Handle failed payment |
| 4 | Payment Notification | CREATE | PayHere server notification |
| 5 | View Payment Status | READ | Check payment status |

**API Endpoints**:
- POST /api/payments/initiate
- POST /api/payments/callback (PayHere redirect)
- POST /api/payments/notify (PayHere server notification)
- GET /api/orders/{id}/payment-status

---

### 3.8 Order Tracking (Customer)
**Database Tables**: `orders`, `order_status_history`, `rider_location_history`

| # | Feature | Type | Description |
|---|---------|------|-------------|
| 1 | View Order Status | READ | Current status with timestamps |
| 2 | View Status History | READ | All status changes |
| 3 | View Rider Location | READ | Real-time GPS tracking |
| 4 | Get Estimated Time | READ | ETA calculation |
| 5 | View Verification Code | READ | 4-digit delivery code |
| 6 | List Order History | READ | All past orders |
| 7 | View Order Details | READ | Full order breakdown |
| 8 | Reorder | CREATE | Create new order from history |

**API Endpoints**:
- GET /api/orders/{id}/status
- GET /api/orders/{id}/tracking
- GET /api/orders
- GET /api/orders/{id}
- POST /api/orders/{id}/reorder

---

### 3.9 Customer Ratings & Reviews
**Database Tables**: `food_reviews`, `rider_reviews`

| # | Feature | Type | Description |
|---|---------|------|-------------|
| 1 | Rate Food Item | CREATE | 1-5 stars for each item |
| 2 | Write Food Review | CREATE | Optional review text |
| 3 | Rate Rider | CREATE | 1-5 stars for delivery |
| 4 | Write Rider Review | CREATE | Optional review text |
| 5 | View My Reviews | READ | List submitted reviews |
| 6 | Edit Review | UPDATE | Modify review (within time limit) |

**API Endpoints**:
- POST /api/orders/{id}/reviews/food
- POST /api/orders/{id}/reviews/rider
- GET /api/reviews/my-reviews

---

### 3.10 Customer Wishlist
**Database Tables**: `user_wishlist`

| # | Feature | Type | Description |
|---|---------|------|-------------|
| 1 | Add to Wishlist | CREATE | Save favorite item |
| 2 | List Wishlist | READ | View saved items |
| 3 | Remove from Wishlist | DELETE | Remove item |

**API Endpoints**:
- POST /api/wishlist
- GET /api/wishlist
- DELETE /api/wishlist/{item_id}

---

## PHASE 4: ADMIN ORDER MANAGEMENT

### 4.1 Live Order Dashboard
**Database Tables**: `orders`, `order_items`

| # | Feature | Type | Description |
|---|---------|------|-------------|
| 1 | View Pending Orders | READ | Real-time pending order list |
| 2 | New Order Alert | READ | Sound/visual notification |
| 3 | Order Reminder | READ | 5-minute reminder for unconfirmed |
| 4 | View Order Details | READ | Full order with customer info |
| 5 | Filter by Branch | READ | Branch-specific view |
| 6 | Filter by Status | READ | Status-based filtering |

**Filament Features**:
- Real-time polling for new orders
- Sound notification for new orders
- Status badges with colors
- Quick action buttons

---

### 4.2 Order Processing (Admin)
**Database Tables**: `orders`, `order_status_history`

| # | Feature | Type | Description |
|---|---------|------|-------------|
| 1 | Confirm Order | UPDATE | Mark as confirmed after calling restaurant |
| 2 | Update to Processing | UPDATE | Restaurant is preparing |
| 3 | Mark Ready for Pickup | UPDATE | Food ready for rider |
| 4 | Add Admin Notes | UPDATE | Internal notes |
| 5 | Cancel Order | UPDATE | Cancel with reason |
| 6 | View Status History | READ | All status changes |

---

### 4.3 Rider Management (Admin)
**Database Tables**: `riders`

| # | Feature | Type | Description |
|---|---------|------|-------------|
| 1 | Register Rider | CREATE | Add new rider (admin only) |
| 2 | Assign Rider ID | CREATE | Auto-generate RDR000001 format |
| 3 | Set Initial Password | CREATE | Temporary password |
| 4 | Assign to Branch | CREATE | Link rider to branch |
| 5 | List Riders | READ | View all riders |
| 6 | View Rider Details | READ | Profile, stats, ratings |
| 7 | View Rider Location | READ | Current GPS position |
| 8 | Edit Rider | UPDATE | Modify rider details |
| 9 | Activate/Deactivate | UPDATE | Toggle rider status |
| 10 | Reset Password | UPDATE | Reset rider password |
| 11 | Delete Rider | DELETE | Soft delete rider |

**Fields**:
- rider_id (auto-generated), full_name
- phone_number, password, email
- profile_image, vehicle_type, vehicle_number
- license_number, assigned_branch_id
- is_active, is_available, is_online

---

### 4.4 Manual Rider Assignment (Admin)
**Database Tables**: `orders`, `rider_order_notifications`, `order_rider_assignments`

| # | Feature | Type | Description |
|---|---------|------|-------------|
| 1 | View Available Riders | READ | List online riders for branch |
| 2 | Assign Rider to Order | UPDATE | Manual assignment |
| 3 | Reassign Rider | UPDATE | Change assigned rider |
| 4 | View Assignment History | READ | Past assignments |

---

## PHASE 5: RIDER AUTHENTICATION & FEATURES

### 5.1 Rider Authentication
**Database Tables**: `riders`, `personal_access_tokens`

| # | Feature | Type | Description |
|---|---------|------|-------------|
| 1 | Rider Login | READ | Login with phone/password |
| 2 | First Login Password Change | UPDATE | Change temporary password |
| 3 | View Profile | READ | Rider profile details |
| 4 | Update Profile | UPDATE | Edit allowed fields |
| 5 | Go Online/Offline | UPDATE | Toggle availability |
| 6 | Update Location | UPDATE | Send GPS coordinates |
| 7 | Logout | DELETE | End session |

**API Endpoints**:
- POST /api/rider/login
- GET /api/rider/profile
- PUT /api/rider/profile
- PUT /api/rider/status (online/offline)
- PUT /api/rider/location
- POST /api/rider/logout

---

### 5.2 Rider Order Management
**Database Tables**: `orders`, `rider_order_notifications`

| # | Feature | Type | Description |
|---|---------|------|-------------|
| 1 | Receive Order Notification | READ | Push notification for new orders |
| 2 | View Order Details | READ | Customer, items, address, payment |
| 3 | Accept Order | UPDATE | Accept delivery assignment |
| 4 | Decline Order | UPDATE | Decline with reason |
| 5 | View Active Orders | READ | Current assigned orders |
| 6 | View Verification Code | READ | 4-digit code for handover |

**API Endpoints**:
- GET /api/rider/orders/available
- GET /api/rider/orders/{id}
- POST /api/rider/orders/{id}/accept
- POST /api/rider/orders/{id}/decline
- GET /api/rider/orders/active

---

### 5.3 Rider Delivery Process
**Database Tables**: `orders`, `order_status_history`, `rider_location_history`

| # | Feature | Type | Description |
|---|---------|------|-------------|
| 1 | Navigate to Restaurant | READ | Google Maps directions |
| 2 | Update Status: Picked Up | UPDATE | Food collected from restaurant |
| 3 | Navigate to Customer | READ | Google Maps to delivery address |
| 4 | Update Status: Delivering | UPDATE | On the way to customer |
| 5 | Enter Verification Code | UPDATE | Customer provides code |
| 6 | Mark as Delivered | UPDATE | Complete delivery |
| 7 | Report Issue | CREATE | Log delivery problems |

**API Endpoints**:
- PUT /api/rider/orders/{id}/picked-up
- PUT /api/rider/orders/{id}/delivering
- PUT /api/rider/orders/{id}/delivered (body: verification_code)
- POST /api/rider/orders/{id}/issue

---

### 5.4 Rider Earnings & History
**Database Tables**: `rider_daily_earnings`, `orders`

| # | Feature | Type | Description |
|---|---------|------|-------------|
| 1 | View Daily Summary | READ | Today's deliveries and tips |
| 2 | View Calendar History | READ | Per-day delivery count |
| 3 | View Tips Collected | READ | Daily/weekly/monthly tips |
| 4 | View Delivery History | READ | Past completed deliveries |
| 5 | View Ratings | READ | Customer ratings received |

**API Endpoints**:
- GET /api/rider/earnings/today
- GET /api/rider/earnings/history?from=&to=
- GET /api/rider/deliveries
- GET /api/rider/ratings

---

## PHASE 6: NOTIFICATIONS & COMMUNICATIONS

### 6.1 SMS Notifications (Notify.lk)
**Database Tables**: `notification_logs`, `otp_verifications`

**Primary Communication Channel**: SMS is the PRIMARY method for all authentication and critical notifications

| # | Feature | Type | Description |
|---|---------|------|-------------|
| 1 | Send Registration OTP | CREATE | 6-digit OTP for phone verification |
| 2 | Send Password Reset OTP | CREATE | 6-digit OTP for password reset |
| 3 | Send Phone Change OTP | CREATE | Verify new phone number |
| 4 | Order Confirmation SMS | CREATE | Customer order placed notification |
| 5 | Order Status SMS | CREATE | Status updates to customer |
| 6 | Rider Assignment SMS | CREATE | Notify customer of rider assignment |
| 7 | Delivery SMS | CREATE | Notify when order is out for delivery |
| 8 | Log SMS Status | CREATE | Track SMS delivery status |

---

### 6.2 Email Notifications (SMTP - Gmail/Mailgun)
**Database Tables**: `notification_logs`

**Note**: Email is OPTIONAL and used only for order receipts and promotions - NOT for authentication

| # | Feature | Type | Description |
|---|---------|------|-------------|
| 1 | Order Confirmation Email | CREATE | Detailed order receipt (if email provided) |
| 2 | Invoice Email | CREATE | Receipt after delivery (if email provided) |
| 3 | Promotional Email | CREATE | Marketing offers (if email provided) |
| 4 | Order Status Email | CREATE | Optional status updates (if email provided) |

---

### 6.3 Push Notifications (Firebase)
**Database Tables**: `notification_logs`

| # | Feature | Type | Description |
|---|---------|------|-------------|
| 1 | New Order (Rider) | CREATE | Alert for available delivery |
| 2 | Order Status (Customer) | CREATE | Status change updates |
| 3 | Promotional (Customer) | CREATE | New offers/promotions |

---

## PHASE 7: REPORTS & ANALYTICS (Admin)

### 7.1 Sales Reports
**Database Views**: `vw_daily_order_summary`, `vw_popular_food_items`

| # | Feature | Type | Description |
|---|---------|------|-------------|
| 1 | Daily Sales Summary | READ | Orders, revenue by day |
| 2 | Sales by Item | READ | Per-item sales data |
| 3 | Sales by Category | READ | Category-wise breakdown |
| 4 | Sales by Branch | READ | Branch comparison |
| 5 | Date Range Filter | READ | Custom date selection |
| 6 | Export to Excel | READ | Download .xlsx file |

---

### 7.2 Financial Reports
**Database Tables**: `orders`, `payment_transactions`

| # | Feature | Type | Description |
|---|---------|------|-------------|
| 1 | Revenue Breakdown | READ | Food, service fee, delivery |
| 2 | Payment Method Analysis | READ | Online vs COD |
| 3 | Discount Report | READ | Total discounts given |
| 4 | Restaurant Payment Due | READ | Amount owed to restaurant |
| 5 | Export to Excel | READ | Download .xlsx file |

---

### 7.3 Rider Performance Reports
**Database Views**: `vw_rider_performance`

| # | Feature | Type | Description |
|---|---------|------|-------------|
| 1 | Rider Summary | READ | Deliveries, ratings, tips |
| 2 | Delivery Time Analysis | READ | Average delivery times |
| 3 | Rating Distribution | READ | Rating breakdown |
| 4 | Top Performers | READ | Ranked by deliveries/rating |
| 5 | Export to Excel | READ | Download .xlsx file |

---

### 7.4 Branch Performance Reports
**Database Views**: `vw_branch_performance`

| # | Feature | Type | Description |
|---|---------|------|-------------|
| 1 | Branch Comparison | READ | Side-by-side metrics |
| 2 | Order Volume | READ | Orders per branch |
| 3 | Revenue per Branch | READ | Revenue comparison |
| 4 | Delivery Performance | READ | Avg delivery time |
| 5 | Export to Excel | READ | Download .xlsx file |

---

## PHASE 8: FUTURE ENHANCEMENTS (Role-Based Access)

### 8.1 Admin Role Management
**Database Tables**: `admin_roles`, `users`

| # | Feature | Type | Description |
|---|---------|------|-------------|
| 1 | Create Admin Role | CREATE | Define new role |
| 2 | Set Permissions | CREATE | Assign permission keys |
| 3 | Create Admin User | CREATE | Add admin with role |
| 4 | List Roles | READ | View all roles |
| 5 | List Admin Users | READ | View all admins |
| 6 | Edit Role Permissions | UPDATE | Modify permissions |
| 7 | Change Admin Role | UPDATE | Reassign user role |
| 8 | Deactivate Admin | UPDATE | Disable admin access |

**Default Roles**:
- super_admin: Full system access
- branch_manager: Branch-level management
- order_handler: Order management only
- support_agent: Customer support

---

## IMPLEMENTATION SUMMARY

| Phase | Focus Area | Estimated Items |
|-------|------------|-----------------|
| 1 | Admin Auth & Setup | 4 features |
| 2 | Admin Data Management | 40+ features |
| 3 | Customer Features | 50+ features |
| 4 | Admin Order Management | 15+ features |
| 5 | Rider Features | 25+ features |
| 6 | Notifications | 10+ features |
| 7 | Reports | 20+ features |
| 8 | Role-Based Access | Future |

---

## DATABASE TABLES BY PHASE

### Phase 1-2 (Admin)
- admin_roles
- users (admin type)
- branches
- food_categories
- food_items
- item_variations
- branch_menu_availability
- offers, offer_items, offer_categories
- promo_codes
- system_settings

### Phase 3 (Customer)
- users (customer type)
- otp_verifications
- password_reset_tokens
- customer_addresses
- shopping_carts, cart_items
- user_wishlist
- orders, order_items
- payment_transactions
- food_reviews

### Phase 4-5 (Rider & Order Management)
- riders
- rider_order_notifications
- order_rider_assignments
- rider_daily_earnings
- rider_location_history
- rider_reviews
- order_status_history

### Phase 6-7 (Notifications & Reports)
- notification_logs
- admin_activity_logs
- api_rate_limits
- Views: vw_daily_order_summary, vw_rider_performance, etc.

---

## NOTES

1. **Super Admin First**: Start with single super_admin user with all permissions
2. **Data In → Data Out**: Always implement CREATE before READ for each feature
3. **API First**: Build Laravel APIs, then connect Next.js/React Native
4. **Test with Postman**: Verify each API before frontend integration
5. **Filament for Admin**: Use Filament resources for all admin CRUD operations
6. **Role-Based Access Later**: Add granular permissions in Phase 8

---

*Document Version: 1.0*
*Last Updated: November 25, 2025*
