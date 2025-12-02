<?php

namespace App\Filament\Resources;

use App\Filament\Resources\BranchVariationAvailabilityResource\Pages;
use App\Models\Branch;
use App\Models\BranchVariationAvailability;
use App\Models\ItemVariation;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class BranchVariationAvailabilityResource extends Resource
{
    protected static ?string $model = BranchVariationAvailability::class;

    protected static ?string $navigationIcon = 'heroicon-o-currency-dollar';

    protected static ?string $navigationGroup = 'Menu Management';

    protected static ?int $navigationSort = 4;

    protected static ?string $navigationLabel = 'Branch Pricing';

    protected static ?string $modelLabel = 'Branch Variant Price';

    protected static ?string $pluralModelLabel = 'Branch Variant Prices';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Branch & Variant Selection')
                    ->schema([
                        Forms\Components\Select::make('branch_id')
                            ->label('Branch')
                            ->options(Branch::where('is_active', true)->pluck('branch_name', 'id'))
                            ->required()
                            ->searchable()
                            ->preload(),

                        Forms\Components\Select::make('variation_id')
                            ->label('Variant')
                            ->options(function () {
                                return ItemVariation::with('foodItem')
                                    ->get()
                                    ->mapWithKeys(function ($variation) {
                                        $label = $variation->foodItem->item_name . ' - ' . $variation->variation_name . ' (Rs. ' . number_format($variation->price, 2) . ')';
                                        return [$variation->id => $label];
                                    });
                            })
                            ->required()
                            ->searchable()
                            ->preload(),
                    ])->columns(2),

                Forms\Components\Section::make('Availability & Pricing')
                    ->schema([
                        Forms\Components\Toggle::make('is_available')
                            ->label('Available at this Branch')
                            ->default(true)
                            ->helperText('If disabled, this variant will be shown as unavailable at this branch'),

                        Forms\Components\TextInput::make('branch_price')
                            ->label('Branch-Specific Price')
                            ->numeric()
                            ->prefix('Rs.')
                            ->placeholder('Leave empty to use default price')
                            ->helperText('Custom price for this branch. Leave empty to use the variant\'s default price.'),
                    ])->columns(2),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('branch.branch_name')
                    ->label('Branch')
                    ->searchable()
                    ->sortable()
                    ->badge()
                    ->color('primary'),

                Tables\Columns\TextColumn::make('variation.foodItem.item_name')
                    ->label('Food Item')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('variation.variation_name')
                    ->label('Variant')
                    ->searchable()
                    ->sortable()
                    ->badge()
                    ->color('info'),

                Tables\Columns\TextColumn::make('variation.price')
                    ->label('Default Price')
                    ->money('LKR')
                    ->sortable()
                    ->color('gray'),

                Tables\Columns\TextColumn::make('branch_price')
                    ->label('Branch Price')
                    ->money('LKR')
                    ->sortable()
                    ->placeholder('Using default')
                    ->color('success')
                    ->weight('bold'),

                Tables\Columns\TextColumn::make('effective_price')
                    ->label('Effective Price')
                    ->money('LKR')
                    ->getStateUsing(fn ($record) => $record->getEffectivePrice())
                    ->badge()
                    ->color('warning'),

                Tables\Columns\IconColumn::make('is_available')
                    ->label('Available')
                    ->boolean()
                    ->sortable(),

                Tables\Columns\TextColumn::make('updated_at')
                    ->label('Last Updated')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->defaultSort('branch_id')
            ->filters([
                Tables\Filters\SelectFilter::make('branch_id')
                    ->label('Branch')
                    ->options(Branch::where('is_active', true)->pluck('branch_name', 'id'))
                    ->searchable()
                    ->preload(),

                Tables\Filters\TernaryFilter::make('is_available')
                    ->label('Availability'),

                Tables\Filters\Filter::make('has_custom_price')
                    ->label('Has Custom Price')
                    ->query(fn ($query) => $query->whereNotNull('branch_price')),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),

                    Tables\Actions\BulkAction::make('make_available')
                        ->label('Mark Available')
                        ->icon('heroicon-o-check-circle')
                        ->color('success')
                        ->action(fn ($records) => $records->each->update(['is_available' => true]))
                        ->deselectRecordsAfterCompletion(),

                    Tables\Actions\BulkAction::make('make_unavailable')
                        ->label('Mark Unavailable')
                        ->icon('heroicon-o-x-circle')
                        ->color('danger')
                        ->action(fn ($records) => $records->each->update(['is_available' => false]))
                        ->deselectRecordsAfterCompletion(),

                    Tables\Actions\BulkAction::make('clear_custom_price')
                        ->label('Clear Custom Prices')
                        ->icon('heroicon-o-arrow-path')
                        ->color('warning')
                        ->action(fn ($records) => $records->each->update(['branch_price' => null]))
                        ->deselectRecordsAfterCompletion()
                        ->requiresConfirmation()
                        ->modalHeading('Clear Custom Prices')
                        ->modalDescription('This will reset the selected items to use their default variant prices.'),
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ManageBranchVariationAvailabilities::route('/'),
        ];
    }
}
