<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\FoodCategory;
use App\Models\FoodItem;
use Illuminate\Http\Request;

class MenuController extends Controller
{
    /**
     * Get all active categories
     */
    public function categories()
    {
        $categories = FoodCategory::active()
            ->ordered()
            ->get(['id', 'category_name', 'category_slug', 'description', 'image']);

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    /**
     * Get category with its food items
     *
     * When branch_id is provided:
     * - All items are returned
     * - Each item shows availability status at that branch
     * - Prices are branch-specific (if set) or default
     *
     * When no branch_id:
     * - All items shown without availability status
     * - Default prices are used
     */
    public function categoryItems($slug, Request $request)
    {
        $category = FoodCategory::where('category_slug', $slug)
            ->active()
            ->first();

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Category not found',
            ], 404);
        }

        $branchId = $request->get('branch_id');

        // Always get ALL items with ALL variations
        $items = $category->activeFoodItems()
            ->with(['variations' => function ($query) {
                $query->where('is_available', true)->orderBy('display_order');
            }, 'variations.branchAvailability'])
            ->orderBy('display_order')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'category' => [
                    'id' => $category->id,
                    'name' => $category->category_name,
                    'slug' => $category->category_slug,
                    'description' => $category->description,
                    'image' => $category->image,
                ],
                'items' => $items->values()->map(function ($item) use ($branchId) {
                    return $this->formatFoodItemWithBranchAvailability($item, $branchId);
                }),
                'branch_id' => $branchId ? (int) $branchId : null,
            ],
        ]);
    }

    /**
     * Get all active food items (paginated)
     *
     * When branch_id is provided:
     * - All items are returned with availability status at that branch
     * - Prices are branch-specific (if set) or default
     *
     * When no branch_id:
     * - All items shown without availability status
     * - Default prices are used
     */
    public function items(Request $request)
    {
        $branchId = $request->get('branch_id');

        $query = FoodItem::where('is_active', true)
            ->where('is_available', true)
            ->with(['category', 'variations' => function ($query) {
                $query->where('is_available', true)->orderBy('display_order');
            }, 'variations.branchAvailability']);

        // Filter by category
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Filter by vegetarian
        if ($request->has('is_vegetarian')) {
            $query->where('is_vegetarian', $request->boolean('is_vegetarian'));
        }

        // Filter by spicy level
        if ($request->has('spicy_level')) {
            $query->where('spicy_level', $request->spicy_level);
        }

        // Sort options
        $sortBy = $request->get('sort_by', 'display_order');
        $sortDir = $request->get('sort_dir', 'asc');

        if (in_array($sortBy, ['display_order', 'item_name', 'average_rating'])) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $items = $query->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => [
                'items' => $items->getCollection()->map(function ($item) use ($branchId) {
                    return $this->formatFoodItemWithBranchAvailability($item, $branchId);
                }),
                'pagination' => [
                    'current_page' => $items->currentPage(),
                    'last_page' => $items->lastPage(),
                    'per_page' => $items->perPage(),
                    'total' => $items->total(),
                ],
                'branch_id' => $branchId ? (int) $branchId : null,
            ],
        ]);
    }

    /**
     * Get single food item details
     */
    public function itemDetail($slug, Request $request)
    {
        $branchId = $request->get('branch_id');

        $item = FoodItem::where('item_slug', $slug)
            ->where('is_active', true)
            ->with(['category', 'variations' => function ($query) {
                $query->where('is_available', true)->orderBy('display_order');
            }, 'variations.branchAvailability'])
            ->first();

        if (!$item) {
            return response()->json([
                'success' => false,
                'message' => 'Item not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatFoodItemWithBranchAvailability($item, $branchId, true),
            'branch_id' => $branchId ? (int) $branchId : null,
        ]);
    }

    /**
     * Search food items
     */
    public function search(Request $request)
    {
        $query = $request->get('q', '');
        $branchId = $request->get('branch_id');

        if (strlen($query) < 2) {
            return response()->json([
                'success' => false,
                'message' => 'Search query must be at least 2 characters',
            ], 400);
        }

        $items = FoodItem::where('is_active', true)
            ->where('is_available', true)
            ->where(function ($q) use ($query) {
                $q->where('item_name', 'like', "%{$query}%")
                    ->orWhere('description', 'like', "%{$query}%")
                    ->orWhere('ingredients', 'like', "%{$query}%");
            })
            ->with(['category', 'variations' => function ($query) {
                $query->where('is_available', true)->orderBy('display_order');
            }, 'variations.branchAvailability'])
            ->limit(20)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'query' => $query,
                'count' => $items->count(),
                'items' => $items->map(function ($item) use ($branchId) {
                    return $this->formatFoodItemWithBranchAvailability($item, $branchId);
                }),
                'branch_id' => $branchId ? (int) $branchId : null,
            ],
        ]);
    }

    /**
     * Get featured/popular items
     */
    public function featured(Request $request)
    {
        $branchId = $request->get('branch_id');

        $items = FoodItem::where('is_active', true)
            ->where('is_available', true)
            ->where('is_featured', true)
            ->with(['category', 'variations' => function ($query) {
                $query->where('is_available', true)->orderBy('display_order');
            }, 'variations.branchAvailability'])
            ->orderByDesc('average_rating')
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $items->map(function ($item) use ($branchId) {
                return $this->formatFoodItemWithBranchAvailability($item, $branchId);
            }),
            'branch_id' => $branchId ? (int) $branchId : null,
        ]);
    }

    /**
     * Get all active branches
     */
    public function branches(Request $request)
    {
        $query = Branch::where('is_active', true);

        // If user provides coordinates, calculate distance
        if ($request->has('latitude') && $request->has('longitude')) {
            $lat = $request->latitude;
            $lng = $request->longitude;

            $query->selectRaw("*,
                (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance",
                [$lat, $lng, $lat]
            )->orderBy('distance');
        }

        $branches = $query->get();

        return response()->json([
            'success' => true,
            'data' => $branches->map(function ($branch) {
                return [
                    'id' => $branch->id,
                    'branch_code' => $branch->branch_code,
                    'branch_name' => $branch->branch_name,
                    'slug' => $branch->branch_slug,
                    'address' => $branch->address,
                    'city' => $branch->city,
                    'phone_number' => $branch->phone_number,
                    'latitude' => $branch->latitude,
                    'longitude' => $branch->longitude,
                    'delivery_radius_km' => $branch->delivery_radius_km,
                    'opening_time' => $branch->opening_time,
                    'closing_time' => $branch->closing_time,
                    'is_open_now' => $this->isBranchOpen($branch),
                    'distance_km' => isset($branch->distance) ? round($branch->distance, 2) : null,
                ];
            }),
        ]);
    }

    /**
     * Get nearest branch for delivery
     */
    public function nearestBranch(Request $request)
    {
        if (!$request->has('latitude') || !$request->has('longitude')) {
            return response()->json([
                'success' => false,
                'message' => 'Latitude and longitude are required',
            ], 400);
        }

        $lat = $request->latitude;
        $lng = $request->longitude;

        $branch = Branch::where('is_active', true)
            ->selectRaw("*,
                (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance",
                [$lat, $lng, $lat]
            )
            ->havingRaw('distance <= delivery_radius_km')
            ->orderBy('distance')
            ->first();

        if (!$branch) {
            return response()->json([
                'success' => false,
                'message' => 'No branch available for delivery to your location',
            ], 404);
        }

        $distance = round($branch->distance, 2);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $branch->id,
                'branch_code' => $branch->branch_code,
                'branch_name' => $branch->branch_name,
                'slug' => $branch->branch_slug,
                'address' => $branch->address,
                'city' => $branch->city,
                'phone_number' => $branch->phone_number,
                'latitude' => $branch->latitude,
                'longitude' => $branch->longitude,
                'distance_km' => $distance,
                'delivery_radius_km' => $branch->delivery_radius_km,
                'is_within_radius' => $distance <= $branch->delivery_radius_km,
                'is_open_now' => $this->isBranchOpen($branch),
                'opening_time' => $branch->opening_time,
                'closing_time' => $branch->closing_time,
            ],
        ]);
    }

    /**
     * Format food item with branch availability information
     *
     * When branchId is provided:
     * - is_available_at_branch: true/false
     * - Each variation shows branch-specific price and availability
     *
     * When branchId is null:
     * - is_available_at_branch: null (not applicable)
     * - Each variation shows default price only
     */
    private function formatFoodItemWithBranchAvailability($item, $branchId = null, $detailed = false)
    {
        $branchId = $branchId ? (int) $branchId : null;

        // Check if item is available at the branch (at least one variation available)
        $isAvailableAtBranch = null;
        $availableVariationsAtBranch = 0;

        if ($branchId) {
            foreach ($item->variations as $variation) {
                $branchAvail = $variation->branchAvailability
                    ->where('branch_id', $branchId)
                    ->first();

                if ($branchAvail && $branchAvail->is_available) {
                    $availableVariationsAtBranch++;
                }
            }
            $isAvailableAtBranch = $availableVariationsAtBranch > 0;
        }

        // Calculate prices - different logic based on whether branch is selected
        $prices = [];
        $allBranchPrices = []; // For calculating price range across all branches

        foreach ($item->variations as $variation) {
            if ($branchId) {
                // Branch selected: Get price at that specific branch
                $branchAvail = $variation->branchAvailability
                    ->where('branch_id', $branchId)
                    ->first();

                if ($branchAvail && $branchAvail->is_available) {
                    $prices[] = $branchAvail->branch_price ?? $variation->price;
                }
            } else {
                // No branch selected: Collect all prices from all branches + default
                $prices[] = $variation->price; // Default price

                // Get all branch prices for this variation
                foreach ($variation->branchAvailability as $branchAvail) {
                    if ($branchAvail->is_available) {
                        $allBranchPrices[] = $branchAvail->branch_price ?? $variation->price;
                    }
                }
            }
        }

        // Calculate starting price and price range
        $startingPrice = count($prices) > 0 ? min($prices) : ($item->variations->min('price') ?? 0);

        // Price range: for when no branch is selected, show min-max across all branches
        $priceRange = null;
        if (!$branchId && count($allBranchPrices) > 0) {
            $allPricesWithDefaults = array_merge($prices, $allBranchPrices);
            $minPrice = min($allPricesWithDefaults);
            $maxPrice = max($allPricesWithDefaults);

            if ($minPrice !== $maxPrice) {
                $priceRange = [
                    'min' => (float) $minPrice,
                    'max' => (float) $maxPrice,
                ];
            }
        }

        $data = [
            'id' => $item->id,
            'name' => $item->item_name,
            'slug' => $item->item_slug,
            'description' => $item->description,
            'starting_price' => (float) $startingPrice,
            'price_range' => $priceRange, // null if same price, or { min, max } if different
            'image' => $item->image,
            'is_vegetarian' => $item->is_vegetarian,
            'is_vegan' => $item->is_vegan,
            'is_spicy' => $item->is_spicy,
            'spicy_level' => $item->spicy_level,
            'is_featured' => $item->is_featured,
            'average_rating' => (float) $item->average_rating,
            'total_ratings' => $item->total_ratings,
            'category' => $item->category ? [
                'id' => $item->category->id,
                'name' => $item->category->category_name,
                'slug' => $item->category->category_slug,
            ] : null,

            // Branch availability status
            'is_available_at_branch' => $isAvailableAtBranch,
            'unavailable_message' => ($branchId && !$isAvailableAtBranch)
                ? 'This item is not available at the selected branch'
                : null,

            'variations' => $item->variations->map(function ($v) use ($branchId) {
                $variationData = [
                    'id' => $v->id,
                    'name' => $v->variation_name,
                    'default_price' => (float) $v->price,
                    'is_default' => $v->is_default,
                ];

                // Add branch-specific info if branch is selected
                if ($branchId) {
                    $branchAvail = $v->branchAvailability
                        ->where('branch_id', $branchId)
                        ->first();

                    if ($branchAvail) {
                        $variationData['is_available_at_branch'] = $branchAvail->is_available;
                        $variationData['branch_price'] = $branchAvail->branch_price !== null
                            ? (float) $branchAvail->branch_price
                            : null;
                        $variationData['effective_price'] = $branchAvail->branch_price !== null
                            ? (float) $branchAvail->branch_price
                            : (float) $v->price;
                    } else {
                        // No branch availability record means not available at this branch
                        $variationData['is_available_at_branch'] = false;
                        $variationData['branch_price'] = null;
                        $variationData['effective_price'] = (float) $v->price;
                    }
                    $variationData['price_range'] = null; // No range when branch is selected
                } else {
                    // No branch selected: Show default price and calculate price range
                    $variationData['effective_price'] = (float) $v->price;

                    // Calculate price range for this variation across all branches
                    $varPrices = [(float) $v->price]; // Include default
                    foreach ($v->branchAvailability as $ba) {
                        if ($ba->is_available && $ba->branch_price !== null) {
                            $varPrices[] = (float) $ba->branch_price;
                        }
                    }

                    $minVarPrice = min($varPrices);
                    $maxVarPrice = max($varPrices);

                    $variationData['price_range'] = ($minVarPrice !== $maxVarPrice)
                        ? ['min' => $minVarPrice, 'max' => $maxVarPrice]
                        : null;
                }

                return $variationData;
            }),
        ];

        if ($detailed) {
            $data['ingredients'] = $item->ingredients;
            $data['preparation_time_minutes'] = $item->preparation_time_minutes;
        }

        return $data;
    }

    /**
     * Format food item for API response (legacy - kept for backwards compatibility)
     */
    private function formatFoodItem($item, $detailed = false, $branchId = null)
    {
        return $this->formatFoodItemWithBranchAvailability($item, $branchId, $detailed);
    }

    /**
     * Validate cart items availability at a specific branch
     * Used during checkout to ensure all selected items can be fulfilled
     *
     * POST /api/v1/menu/validate-cart
     * Body: { branch_id: int, items: [{ variation_id: int, quantity: int }] }
     */
    public function validateCart(Request $request)
    {
        $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
            'items' => 'required|array|min:1',
            'items.*.variation_id' => 'required|integer|exists:item_variations,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $branchId = $request->branch_id;
        $cartItems = $request->items;

        $branch = Branch::find($branchId);
        if (!$branch || !$branch->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Selected branch is not available',
            ], 400);
        }

        $validationResults = [];
        $allAvailable = true;
        $totalPrice = 0;

        foreach ($cartItems as $cartItem) {
            $variation = \App\Models\ItemVariation::with(['foodItem', 'branchAvailability' => function ($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            }])->find($cartItem['variation_id']);

            if (!$variation) {
                $validationResults[] = [
                    'variation_id' => $cartItem['variation_id'],
                    'is_valid' => false,
                    'error' => 'Variation not found',
                ];
                $allAvailable = false;
                continue;
            }

            $branchAvail = $variation->branchAvailability->first();

            $isAvailable = $branchAvail && $branchAvail->is_available;
            $effectivePrice = $branchAvail && $branchAvail->branch_price !== null
                ? (float) $branchAvail->branch_price
                : (float) $variation->price;

            $itemTotal = $effectivePrice * $cartItem['quantity'];

            $validationResults[] = [
                'variation_id' => $variation->id,
                'food_item_id' => $variation->food_item_id,
                'food_item_name' => $variation->foodItem->item_name,
                'variation_name' => $variation->variation_name,
                'quantity' => $cartItem['quantity'],
                'is_available' => $isAvailable,
                'default_price' => (float) $variation->price,
                'branch_price' => $branchAvail && $branchAvail->branch_price !== null
                    ? (float) $branchAvail->branch_price
                    : null,
                'effective_price' => $effectivePrice,
                'item_total' => $itemTotal,
                'error' => !$isAvailable ? 'Item not available at this branch' : null,
            ];

            if (!$isAvailable) {
                $allAvailable = false;
            } else {
                $totalPrice += $itemTotal;
            }
        }

        return response()->json([
            'success' => $allAvailable,
            'message' => $allAvailable
                ? 'All items are available at the selected branch'
                : 'Some items are not available at the selected branch',
            'data' => [
                'branch' => [
                    'id' => $branch->id,
                    'name' => $branch->branch_name,
                    'is_open' => $this->isBranchOpen($branch),
                ],
                'all_items_available' => $allAvailable,
                'items' => $validationResults,
                'subtotal' => $totalPrice,
                'unavailable_items' => collect($validationResults)
                    ->where('is_available', false)
                    ->values()
                    ->toArray(),
            ],
        ]);
    }

    /**
     * Check if branch is currently open
     */
    private function isBranchOpen($branch)
    {
        $now = now();
        $currentTime = $now->format('H:i:s');
        $dayOfWeek = strtolower($now->format('l'));

        // Check weekly schedule if exists
        if ($branch->weekly_schedule) {
            $schedule = $branch->weekly_schedule[$dayOfWeek] ?? null;
            if ($schedule && isset($schedule['is_open']) && !$schedule['is_open']) {
                return false;
            }
            if ($schedule && isset($schedule['open']) && isset($schedule['close'])) {
                return $currentTime >= $schedule['open'] && $currentTime <= $schedule['close'];
            }
        }

        // Fall back to default opening/closing times
        return $currentTime >= $branch->opening_time && $currentTime <= $branch->closing_time;
    }
}
