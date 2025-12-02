<?php

namespace App\Filament\Resources\FoodCategoryResource\Pages;

use App\Filament\Resources\FoodCategoryResource;
use Filament\Actions;
use Filament\Resources\Pages\ViewRecord;

class ViewFoodCategory extends ViewRecord
{
    protected static string $resource = FoodCategoryResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\EditAction::make(),
        ];
    }
}
