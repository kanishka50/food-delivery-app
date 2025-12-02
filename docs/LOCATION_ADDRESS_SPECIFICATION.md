# Location & Address Management - Technical Specification

## Overview
This document outlines the technical approach for handling user location tracking, branch detection, and delivery address management in the Food Delivery System.

---

## Core Principles

1. **Privacy First**: User GPS location is stored temporarily in browser only
2. **Simplicity**: 90% of users order to current location - optimize for this
3. **Flexibility**: Support rare cases (send to friend, different address)
4. **Optional Saving**: Users control what addresses are saved permanently
5. **Auto-Geocoding**: Lat/long calculated automatically, never manually entered

---

## Location Tracking Strategy

### Browser-Side GPS (Recommended ✅)

**Storage Location**: `sessionStorage` (browser)

**Lifecycle**:
- Captured: When user opens app/logs in
- Stored: In `sessionStorage` as JSON
- Cleared: When browser tab/window closes
- Sent to Backend: Only when needed (find branch, place order)

**Implementation**:
```javascript
// Request GPS permission
navigator.geolocation.getCurrentPosition((position) => {
  const location = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    timestamp: new Date().toISOString()
  };

  // Store temporarily in browser
  sessionStorage.setItem('userLocation', JSON.stringify(location));

  // Send to backend to find nearest branch
  findNearestBranch(location);
});
```

**Why sessionStorage?**
- ✅ Privacy-friendly (not sent to server unless needed)
- ✅ Temporary (auto-deleted when tab closes)
- ✅ Fast (no network calls)
- ✅ No database storage required

---

## Address Management

### Three Address Types

#### 1. Current Location Address (Most Common - 90%)

**User Flow**:
```
User at Checkout:
  ↓
Select "Use Current Location"
  ↓
GPS pulled from sessionStorage
  ↓
User adds:
  - Building/Apartment name
  - Floor/Unit number
  - Phone number
  - Delivery instructions
  ↓
Optional checkbox: "Save this address as Home/Office?"
  ↓
Place Order
```

**Backend Storage**:
- If "Save" unchecked → Store in `orders.delivery_address_json` only
- If "Save" checked → Create in `customer_addresses` table

---

#### 2. Saved Address (Return Customers)

**User Flow**:
```
User at Checkout:
  ↓
Select "Use Saved Address"
  ↓
Choose from dropdown: Home, Office, etc.
  ↓
Address pre-filled with all details
  ↓
Place Order
```

**Backend Storage**:
- Address already exists in `customer_addresses` table
- Order references: `customer_address_id`

---

#### 3. New Manual Address (Rare - 10%)

**User Flow**:
```
User at Checkout:
  ↓
Select "Enter New Address"
  ↓
User manually types:
  - Street address
  - City
  - District (dropdown)
  - Building/apartment details
  - Phone number
  ↓
Backend geocodes address → lat/long
  ↓
Validate delivery radius
  ↓
Optional checkbox: "Save this address?"
  ↓
Place Order
```

**Backend Storage**:
- If "Save" unchecked → Store in `orders.delivery_address_json` only
- If "Save" checked → Create in `customer_addresses` table

---

## Database Schema

### customer_addresses Table (Saved Addresses Only)

```sql
CREATE TABLE customer_addresses (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  address_label VARCHAR(50),              -- "Home", "Office", etc.
  recipient_name VARCHAR(100) NOT NULL,   -- Who receives the order
  phone_number VARCHAR(20) NOT NULL,      -- Contact for delivery
  address_line1 VARCHAR(255) NOT NULL,    -- Street address (manual)
  address_line2 VARCHAR(255),             -- Building/Floor (manual)
  city VARCHAR(100) NOT NULL,             -- City (manual)
  district VARCHAR(100) NOT NULL,         -- District (manual dropdown)
  postal_code VARCHAR(20),                -- Optional (manual)
  latitude DECIMAL(10,8),                 -- Auto-calculated via geocoding
  longitude DECIMAL(11,8),                -- Auto-calculated via geocoding
  delivery_instructions TEXT,             -- Special notes (manual)
  is_default BOOLEAN DEFAULT FALSE,       -- Default address flag
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP,                   -- Soft deletes

  INDEX idx_user_id (user_id),
  INDEX idx_user_default (user_id, is_default),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### orders Table (Address Storage)

```sql
CREATE TABLE orders (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  customer_address_id BIGINT UNSIGNED,    -- Reference to saved address (nullable)
  delivery_address_json JSON,             -- Full address if not saved (nullable)
  branch_id BIGINT UNSIGNED NOT NULL,
  -- ... other order fields

  -- Either customer_address_id OR delivery_address_json must be present
  -- If saved address: customer_address_id is set, delivery_address_json is NULL
  -- If not saved: customer_address_id is NULL, delivery_address_json contains full address
);
```

**delivery_address_json Structure**:
```json
{
  "type": "current_location" | "manual_entry" | "saved_address",
  "latitude": 6.8565,
  "longitude": 79.8821,
  "address_line1": "45 Galle Road",
  "address_line2": "Apartment 3B, 2nd Floor",
  "city": "Dehiwala",
  "district": "Colombo",
  "postal_code": "10350",
  "phone_number": "0771234567",
  "recipient_name": "John Doe",
  "delivery_instructions": "Ring bell twice, use back entrance",
  "captured_at": "2025-11-26T15:30:00Z"
}
```

---

## Geocoding Service

### Google Maps Geocoding API

**Purpose**: Convert address text → latitude/longitude

**When to Use**:
- When user enters new manual address
- When user saves an address
- When user edits a saved address (if address fields changed)

**Not Required When**:
- Using current location (GPS already provides lat/long)
- Using saved address (lat/long already stored)

**Implementation**:

```php
// Backend - AddressController
public function geocodeAddress(Request $request)
{
    $address = sprintf(
        "%s, %s, %s, Sri Lanka",
        $request->address_line1,
        $request->city,
        $request->district
    );

    $response = Http::get('https://maps.googleapis.com/maps/api/geocode/json', [
        'address' => $address,
        'key' => config('services.google.maps_api_key'),
    ]);

    $data = $response->json();

    if ($data['status'] === 'OK') {
        $location = $data['results'][0]['geometry']['location'];

        return response()->json([
            'success' => true,
            'latitude' => $location['lat'],
            'longitude' => $location['lng'],
            'formatted_address' => $data['results'][0]['formatted_address'],
        ]);
    }

    return response()->json([
        'success' => false,
        'message' => 'Unable to geocode address',
    ], 400);
}
```

**API Requirements**:
- Postal code NOT required for geocoding
- Format: "Street, City, District, Country" is sufficient
- Sri Lanka is well-mapped by Google

---

## Branch Detection & Validation

### Find Nearest Branch

**Endpoint**: `POST /api/branches/nearest`

**Request Body**:
```json
{
  "latitude": 6.8565,
  "longitude": 79.8821
}
```

**Response**:
```json
{
  "success": true,
  "nearest_branch": {
    "id": 1,
    "branch_name": "Downtown Colombo",
    "distance_km": 2.3,
    "is_within_radius": true,
    "delivery_radius_km": 5.0,
    "is_open_now": true
  },
  "all_branches": [
    {
      "id": 1,
      "branch_name": "Downtown Colombo",
      "distance_km": 2.3
    },
    {
      "id": 2,
      "branch_name": "Dehiwala Branch",
      "distance_km": 4.1
    }
  ]
}
```

**Distance Calculation** (Haversine Formula):
```php
public static function calculateDistance($lat1, $lon1, $lat2, $lon2)
{
    $earthRadius = 6371; // km

    $latDiff = deg2rad($lat2 - $lat1);
    $lonDiff = deg2rad($lon2 - $lon1);

    $a = sin($latDiff / 2) * sin($latDiff / 2) +
         cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
         sin($lonDiff / 2) * sin($lonDiff / 2);

    $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

    return $earthRadius * $c;
}
```

---

## Complete User Flows

### Flow 1: First-Time User, Current Location Order

```
1. User opens app
2. Browser asks: "Allow location access?"
3. User clicks "Allow"
4. GPS coordinates captured: { lat: 6.8565, lng: 79.8821 }
5. Stored in sessionStorage
6. Backend called: POST /api/branches/nearest
7. Response: "Downtown Colombo Branch (2.3km away)"
8. User browses menu, adds to cart
9. User goes to checkout
10. Default selected: "📍 Deliver to current location"
11. User adds:
    - Building: "Apartment Complex A"
    - Unit: "3B, 2nd Floor"
    - Phone: "0771234567"
    - Instructions: "Ring bell twice"
12. Checkbox: "💾 Save this address as Home?" → User checks it ✅
13. User clicks "Place Order"
14. Backend:
    - Creates entry in customer_addresses (saved for future)
    - Creates order with customer_address_id reference
15. Order placed successfully
16. Next time: User can just select "Home" at checkout
```

---

### Flow 2: Return Customer, Saved Address

```
1. User logs in (GPS still captured for distance display)
2. User browses menu, adds to cart
3. User goes to checkout
4. Selects: "🏠 Use saved address" → Dropdown: "Home"
5. Address auto-filled with all saved details
6. User clicks "Place Order"
7. Backend:
    - Uses customer_address_id from saved address
    - No new address created
8. Order placed successfully
```

---

### Flow 3: Send to Friend (Different Address)

```
1. User logs in from Office
2. User browses menu, adds to cart
3. User goes to checkout
4. Selects: "✏️ Enter different address"
5. User types:
    - Street: "123 Main Street"
    - City: "Colombo"
    - District: "Colombo" (dropdown)
    - Building: "Blue House"
    - Phone: "0779876543" (friend's number)
    - Recipient: "Jane Doe" (friend's name)
6. Checkbox: "💾 Save this address?" → User UNCHECKS ❌
7. User clicks "Place Order"
8. Backend:
    - Geocodes address: "123 Main Street, Colombo, Colombo, Sri Lanka"
    - Gets lat/long: { lat: 6.9271, lng: 79.8612 }
    - Validates: Within branch delivery radius ✅
    - Creates order with delivery_address_json (NOT saved to customer_addresses)
9. Order placed successfully
10. Next time: This address is NOT available in saved addresses
```

---

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/branches/nearest` | POST | Find nearest branch by GPS |
| `/api/geocode/address` | POST | Convert address text → lat/long |
| `/api/addresses` | GET | List user's saved addresses |
| `/api/addresses` | POST | Create saved address (geocodes automatically) |
| `/api/addresses/{id}` | GET | Get specific saved address |
| `/api/addresses/{id}` | PUT | Update saved address (re-geocodes if changed) |
| `/api/addresses/{id}/default` | POST | Set as default address |
| `/api/addresses/{id}` | DELETE | Delete saved address |
| `/api/orders/validate-address` | POST | Check if address within delivery radius |
| `/api/orders` | POST | Place order (includes save_address boolean) |

---

## Environment Configuration

Add to `.env`:
```env
# Google Maps API
GOOGLE_MAPS_API_KEY=your_api_key_here

# Geocoding Service
GEOCODING_ENABLED=true
GEOCODING_PROVIDER=google
```

---

## Privacy & Security Considerations

1. **GPS Location**:
   - ✅ Stored in browser sessionStorage only
   - ✅ Never permanently stored in database
   - ✅ Cleared when browser tab closes
   - ✅ User must grant permission explicitly

2. **Saved Addresses**:
   - ✅ User controls what is saved (opt-in via checkbox)
   - ✅ User can delete saved addresses anytime
   - ✅ Lat/long auto-calculated, not exposed to user

3. **Order Addresses**:
   - ✅ Permanent storage only when order is placed
   - ✅ Required for delivery (legitimate business need)
   - ✅ Soft deletes (can be purged after X months)

---

## Testing Scenarios

### Test 1: Current Location Order (GPS)
- Allow location permission
- Verify sessionStorage contains location
- Place order without saving
- Verify `orders.delivery_address_json` contains GPS data
- Verify `customer_addresses` table NOT updated

### Test 2: Save Address from GPS
- Allow location permission
- Check "Save this address"
- Place order
- Verify entry created in `customer_addresses`
- Verify `orders.customer_address_id` references saved address

### Test 3: Manual Address Entry
- Enter address manually
- Backend geocodes successfully
- Address validated within delivery radius
- Don't save address
- Verify stored in `orders.delivery_address_json` only

### Test 4: Invalid Address (Outside Radius)
- Enter address 50km away
- Geocoding succeeds
- Delivery radius validation FAILS
- Error shown: "Sorry, we don't deliver to this area"

### Test 5: Geocoding Failure
- Enter invalid/incomplete address
- Geocoding fails
- Error shown: "Unable to find this address. Please check and try again"

---

*Document Version: 1.0*
*Last Updated: November 26, 2025*
*Status: Approved for Implementation*
