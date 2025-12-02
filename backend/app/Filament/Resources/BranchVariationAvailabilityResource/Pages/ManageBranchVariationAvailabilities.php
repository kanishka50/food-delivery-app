<?php

namespace App\Filament\Resources\BranchVariationAvailabilityResource\Pages;

use App\Filament\Resources\BranchVariationAvailabilityResource;
use Filament\Actions;
use Filament\Resources\Pages\ManageRecords;

class ManageBranchVariationAvailabilities extends ManageRecords
{
    protected static string $resource = BranchVariationAvailabilityResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
