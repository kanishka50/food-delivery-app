<?php

namespace App\Services;

use App\Models\Branch;
use Illuminate\Support\Collection;

class LocationService
{
    /**
     * Calculate distance between two coordinates using Haversine formula
     * Returns distance in kilometers
     */
    public function calculateDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371; // Earth's radius in kilometers

        $latDiff = deg2rad($lat2 - $lat1);
        $lngDiff = deg2rad($lng2 - $lng1);

        $a = sin($latDiff / 2) * sin($latDiff / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($lngDiff / 2) * sin($lngDiff / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    /**
     * Find the nearest branch to given coordinates
     * Returns branch with distance information
     */
    public function findNearestBranch(float $latitude, float $longitude, bool $activeOnly = true): ?Branch
    {
        $query = Branch::query();

        if ($activeOnly) {
            $query->where('is_active', true);
        }

        $branch = $query
            ->selectRaw("*,
                (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance",
                [$latitude, $longitude, $latitude]
            )
            ->orderBy('distance')
            ->first();

        return $branch;
    }

    /**
     * Find the nearest branch that can deliver to the given coordinates
     * (i.e., distance is within the branch's delivery radius)
     */
    public function findNearestDeliverableBranch(float $latitude, float $longitude): ?Branch
    {
        return Branch::where('is_active', true)
            ->selectRaw("*,
                (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance",
                [$latitude, $longitude, $latitude]
            )
            ->havingRaw('distance <= delivery_radius_km')
            ->orderBy('distance')
            ->first();
    }

    /**
     * Get all branches sorted by distance from given coordinates
     */
    public function getBranchesByDistance(float $latitude, float $longitude, bool $activeOnly = true): Collection
    {
        $query = Branch::query();

        if ($activeOnly) {
            $query->where('is_active', true);
        }

        return $query
            ->selectRaw("*,
                (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance",
                [$latitude, $longitude, $latitude]
            )
            ->orderBy('distance')
            ->get();
    }

    /**
     * Get all branches that can deliver to the given coordinates
     */
    public function getDeliverableBranches(float $latitude, float $longitude): Collection
    {
        return Branch::where('is_active', true)
            ->selectRaw("*,
                (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance",
                [$latitude, $longitude, $latitude]
            )
            ->havingRaw('distance <= delivery_radius_km')
            ->orderBy('distance')
            ->get();
    }

    /**
     * Check if a specific branch can deliver to the given coordinates
     */
    public function canBranchDeliver(Branch $branch, float $latitude, float $longitude): bool
    {
        $distance = $this->calculateDistance(
            $branch->latitude,
            $branch->longitude,
            $latitude,
            $longitude
        );

        return $distance <= $branch->delivery_radius_km;
    }

    /**
     * Get distance to a specific branch from given coordinates
     */
    public function getDistanceToBranch(Branch $branch, float $latitude, float $longitude): float
    {
        return $this->calculateDistance(
            $branch->latitude,
            $branch->longitude,
            $latitude,
            $longitude
        );
    }

    /**
     * Check if coordinates are within a specified radius of a center point
     */
    public function isWithinRadius(
        float $centerLat,
        float $centerLng,
        float $targetLat,
        float $targetLng,
        float $radiusKm
    ): bool {
        $distance = $this->calculateDistance($centerLat, $centerLng, $targetLat, $targetLng);
        return $distance <= $radiusKm;
    }

    /**
     * Format branch data with delivery information
     */
    public function formatBranchWithDeliveryInfo(Branch $branch, float $latitude, float $longitude): array
    {
        $distance = $this->getDistanceToBranch($branch, $latitude, $longitude);
        $canDeliver = $distance <= $branch->delivery_radius_km;

        return [
            'id' => $branch->id,
            'branch_code' => $branch->branch_code,
            'branch_name' => $branch->branch_name,
            'slug' => $branch->branch_slug,
            'address' => $branch->address,
            'city' => $branch->city,
            'contact_number' => $branch->contact_number,
            'latitude' => (float) $branch->latitude,
            'longitude' => (float) $branch->longitude,
            'distance_km' => round($distance, 2),
            'delivery_radius_km' => (float) $branch->delivery_radius_km,
            'can_deliver' => $canDeliver,
            'is_open_now' => $branch->isCurrentlyOpen(),
            'opening_time' => $branch->opening_time ? $branch->opening_time->format('H:i') : null,
            'closing_time' => $branch->closing_time ? $branch->closing_time->format('H:i') : null,
        ];
    }
}
