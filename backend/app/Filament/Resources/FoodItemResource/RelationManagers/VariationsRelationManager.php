<?php

namespace App\Filament\Resources\FoodItemResource\RelationManagers;

use App\Models\Branch;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Table;

class VariationsRelationManager extends RelationManager
{
    protected static string $relationship = 'variations';

    protected static ?string $title = 'Variations & Branch Pricing';

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Variation Details')
                    ->schema([
                        Forms\Components\TextInput::make('variation_name')
                            ->required()
                            ->maxLength(50)
                            ->placeholder('e.g., Small, Medium, Large'),

                        Forms\Components\TextInput::make('price')
                            ->required()
                            ->numeric()
                            ->prefix('Rs.')
                            ->helperText('Default price (used when no branch-specific price is set)'),

                        Forms\Components\Toggle::make('is_default')
                            ->label('Default Variation')
                            ->helperText('Pre-selected when customer views item'),

                        Forms\Components\Toggle::make('is_available')
                            ->label('Available')
                            ->default(true),

                        Forms\Components\TextInput::make('display_order')
                            ->numeric()
                            ->default(0)
                            ->helperText('Order in which variations appear'),
                    ])->columns(2),

                Forms\Components\Section::make('Branch Availability & Pricing')
                    ->description('Set availability and custom prices for each branch. Leave price empty to use default price.')
                    ->schema([
                        Forms\Components\Repeater::make('branchAvailability')
                            ->relationship()
                            ->schema([
                                Forms\Components\Select::make('branch_id')
                                    ->label('Branch')
                                    ->options(Branch::where('is_active', true)->pluck('branch_name', 'id'))
                                    ->required()
                                    ->searchable()
                                    ->disableOptionsWhenSelectedInSiblingRepeaterItems(),

                                Forms\Components\Toggle::make('is_available')
                                    ->label('Available at this branch')
                                    ->default(true),

                                Forms\Components\TextInput::make('branch_price')
                                    ->label('Branch Price')
                                    ->numeric()
                                    ->prefix('Rs.')
                                    ->placeholder('Use default')
                                    ->helperText('Leave empty to use default price'),
                            ])
                            ->columns(3)
                            ->itemLabel(fn (array $state): ?string =>
                                Branch::find($state['branch_id'])?->branch_name ?? 'Select Branch'
                            )
                            ->collapsible()
                            ->reorderable(false)
                            ->addActionLabel('Add Branch Availability'),
                    ])
                    ->collapsible(),
            ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('variation_name')
            ->columns([
                Tables\Columns\TextColumn::make('variation_name')
                    ->label('Variation')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('price')
                    ->label('Default Price')
                    ->money('LKR')
                    ->sortable(),

                Tables\Columns\IconColumn::make('is_default')
                    ->label('Default')
                    ->boolean(),

                Tables\Columns\IconColumn::make('is_available')
                    ->label('Available')
                    ->boolean(),

                Tables\Columns\TextColumn::make('branchAvailability')
                    ->label('Branches')
                    ->badge()
                    ->getStateUsing(function ($record) {
                        $count = $record->branchAvailability()->where('is_available', true)->count();
                        return $count . ' branch(es)';
                    })
                    ->color('success'),

                Tables\Columns\TextColumn::make('display_order')
                    ->label('Order')
                    ->sortable(),
            ])
            ->defaultSort('display_order')
            ->filters([
                Tables\Filters\TernaryFilter::make('is_available'),
            ])
            ->headerActions([
                Tables\Actions\CreateAction::make(),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }
}
