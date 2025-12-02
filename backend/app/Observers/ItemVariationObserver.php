<?php

namespace App\Observers;

use App\Models\ItemVariation;

class ItemVariationObserver
{
    /**
     * Handle the ItemVariation "created" event.
     */
    public function created(ItemVariation $itemVariation): void
    {
        $this->updateFoodItemHasVariations($itemVariation);
    }

    /**
     * Handle the ItemVariation "deleted" event.
     */
    public function deleted(ItemVariation $itemVariation): void
    {
        $this->updateFoodItemHasVariations($itemVariation);
    }

    /**
     * Handle the ItemVariation "restored" event.
     */
    public function restored(ItemVariation $itemVariation): void
    {
        $this->updateFoodItemHasVariations($itemVariation);
    }

    /**
     * Handle the ItemVariation "force deleted" event.
     */
    public function forceDeleted(ItemVariation $itemVariation): void
    {
        $this->updateFoodItemHasVariations($itemVariation);
    }

    /**
     * Update the parent food item's has_variations field
     */
    private function updateFoodItemHasVariations(ItemVariation $itemVariation): void
    {
        if ($itemVariation->foodItem) {
            $hasVariations = $itemVariation->foodItem->variations()->count() > 0;
            $itemVariation->foodItem->update(['has_variations' => $hasVariations]);
        }
    }
}
