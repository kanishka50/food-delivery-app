<?php

namespace App\Filament\Resources\FoodItemResource\Pages;

use App\Filament\Resources\FoodItemResource;
use Filament\Resources\Pages\CreateRecord;

class CreateFoodItem extends CreateRecord
{
    protected static string $resource = FoodItemResource::class;

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }
}
