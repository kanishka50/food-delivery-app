<?php

namespace App\Filament\Resources;

use App\Filament\Resources\FoodItemResource\Pages;
use App\Filament\Resources\FoodItemResource\RelationManagers;
use App\Models\FoodCategory;
use App\Models\FoodItem;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class FoodItemResource extends Resource
{
    protected static ?string $model = FoodItem::class;

    protected static ?string $navigationIcon = 'heroicon-o-cake';

    protected static ?string $navigationGroup = 'Menu Management';

    protected static ?int $navigationSort = 2;

    protected static ?string $recordTitleAttribute = 'item_name';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Basic Information')
                    ->schema([
                        Forms\Components\Select::make('category_id')
                            ->relationship('category', 'category_name')
                            ->required()
                            ->searchable()
                            ->preload(),
                        Forms\Components\TextInput::make('item_name')
                            ->required()
                            ->maxLength(200),
                        Forms\Components\TextInput::make('item_slug')
                            ->maxLength(200)
                            ->helperText('URL-friendly name (auto-generated if empty)'),
                        Forms\Components\Textarea::make('description')
                            ->maxLength(65535)
                            ->columnSpanFull(),
                        Forms\Components\Textarea::make('ingredients')
                            ->maxLength(65535)
                            ->columnSpanFull()
                            ->helperText('List of ingredients'),
                        Forms\Components\FileUpload::make('image')
                            ->image()
                            ->directory('food-items')
                            ->maxSize(2048)
                            ->columnSpanFull(),
                    ])->columns(2),

                Forms\Components\Section::make('Pricing & Variations')
                    ->description('All items must have at least one variation. For simple items, create a "Standard" variation.')
                    ->schema([
                        Forms\Components\Placeholder::make('pricing_note')
                            ->content('⚠️ Important: Prices are set per variation below. Each item MUST have at least one variation.')
                            ->columnSpanFull(),
                        Forms\Components\Repeater::make('variations')
                            ->relationship()
                            ->schema([
                                Forms\Components\TextInput::make('variation_name')
                                    ->required()
                                    ->maxLength(50)
                                    ->placeholder('e.g., Small, Medium, Large, or "Standard" for simple items')
                                    ->helperText('For simple items without sizes, use "Standard"'),
                                Forms\Components\TextInput::make('price')
                                    ->required()
                                    ->numeric()
                                    ->prefix('Rs.')
                                    ->helperText('System-wide price for this variant'),
                                Forms\Components\Toggle::make('is_default')
                                    ->label('Default')
                                    ->helperText('Pre-selected variant'),
                                Forms\Components\Toggle::make('is_available')
                                    ->label('Available')
                                    ->default(true),
                                Forms\Components\TextInput::make('display_order')
                                    ->numeric()
                                    ->default(0)
                                    ->helperText('Sort order'),
                            ])
                            ->columns(5)
                            ->defaultItems(1)
                            ->minItems(1)
                            ->reorderable()
                            ->collapsible()
                            ->itemLabel(fn (array $state): ?string => $state['variation_name'] ?? 'New Variation'),
                    ])
                    ->columnSpanFull(),

                Forms\Components\Section::make('Food Attributes')
                    ->schema([
                        Forms\Components\Toggle::make('is_vegetarian')
                            ->label('Vegetarian'),
                        Forms\Components\Toggle::make('is_vegan')
                            ->label('Vegan'),
                        Forms\Components\Toggle::make('is_spicy')
                            ->label('Spicy')
                            ->reactive(),
                        Forms\Components\Select::make('spicy_level')
                            ->options([
                                0 => 'Not Spicy',
                                1 => 'Mild',
                                2 => 'Medium',
                                3 => 'Hot',
                                4 => 'Very Hot',
                                5 => 'Extreme',
                            ])
                            ->default(0)
                            ->visible(fn (Forms\Get $get) => $get('is_spicy')),
                        Forms\Components\TextInput::make('preparation_time_minutes')
                            ->numeric()
                            ->default(20)
                            ->suffix('minutes')
                            ->helperText('Estimated preparation time'),
                    ])->columns(3),

                Forms\Components\Section::make('Display & Status')
                    ->schema([
                        Forms\Components\TextInput::make('display_order')
                            ->numeric()
                            ->default(0)
                            ->helperText('Lower numbers appear first'),
                        Forms\Components\Toggle::make('is_available')
                            ->label('Available')
                            ->default(true)
                            ->helperText('Temporarily unavailable items'),
                        Forms\Components\Toggle::make('is_featured')
                            ->label('Featured')
                            ->default(false)
                            ->helperText('Show on homepage featured section'),
                        Forms\Components\Toggle::make('is_active')
                            ->label('Active')
                            ->default(true)
                            ->helperText('Inactive items are hidden from menu'),
                    ])->columns(4),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\ImageColumn::make('image')
                    ->circular(),
                Tables\Columns\TextColumn::make('item_name')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('category.category_name')
                    ->sortable()
                    ->badge(),
                Tables\Columns\TextColumn::make('variations_min_price')
                    ->label('Starting Price')
                    ->money('LKR')
                    ->getStateUsing(fn ($record) => $record->variations()->min('price'))
                    ->sortable(query: function (Builder $query, string $direction): Builder {
                        return $query->orderBy(
                            \DB::table('item_variations')
                                ->selectRaw('MIN(price)')
                                ->whereColumn('food_item_id', 'food_items.id'),
                            $direction
                        );
                    }),
                Tables\Columns\TextColumn::make('variations_count')
                    ->label('Variants')
                    ->counts('variations')
                    ->badge()
                    ->color('success'),
                Tables\Columns\IconColumn::make('is_vegetarian')
                    ->boolean()
                    ->label('Veg'),
                Tables\Columns\IconColumn::make('is_spicy')
                    ->boolean()
                    ->label('Spicy'),
                Tables\Columns\TextColumn::make('average_rating')
                    ->numeric(2)
                    ->sortable()
                    ->label('Rating'),
                Tables\Columns\TextColumn::make('total_orders')
                    ->numeric()
                    ->sortable()
                    ->label('Orders'),
                Tables\Columns\IconColumn::make('is_available')
                    ->boolean()
                    ->label('Available'),
                Tables\Columns\IconColumn::make('is_featured')
                    ->boolean()
                    ->label('Featured'),
                Tables\Columns\IconColumn::make('is_active')
                    ->boolean()
                    ->label('Active'),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('category_id')
                    ->relationship('category', 'category_name')
                    ->label('Category'),
                Tables\Filters\TernaryFilter::make('is_vegetarian')
                    ->label('Vegetarian'),
                Tables\Filters\TernaryFilter::make('is_available')
                    ->label('Available'),
                Tables\Filters\TernaryFilter::make('is_featured')
                    ->label('Featured'),
                Tables\Filters\TernaryFilter::make('is_active')
                    ->label('Active'),
                Tables\Filters\TrashedFilter::make(),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                    Tables\Actions\ForceDeleteBulkAction::make(),
                    Tables\Actions\RestoreBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [
            RelationManagers\VariationsRelationManager::class,
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListFoodItems::route('/'),
            'create' => Pages\CreateFoodItem::route('/create'),
            'view' => Pages\ViewFoodItem::route('/{record}'),
            'edit' => Pages\EditFoodItem::route('/{record}/edit'),
        ];
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->withoutGlobalScopes([
                SoftDeletingScope::class,
            ]);
    }
}
