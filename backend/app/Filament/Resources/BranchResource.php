<?php

namespace App\Filament\Resources;

use App\Filament\Resources\BranchResource\Pages;
use App\Models\Branch;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class BranchResource extends Resource
{
    protected static ?string $model = Branch::class;

    protected static ?string $navigationIcon = 'heroicon-o-building-storefront';

    protected static ?string $navigationGroup = 'Settings';

    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Basic Information')
                    ->schema([
                        Forms\Components\TextInput::make('branch_name')
                            ->required()
                            ->maxLength(150),
                        Forms\Components\TextInput::make('branch_code')
                            ->maxLength(20)
                            ->disabled()
                            ->dehydrated(false)
                            ->helperText('Auto-generated'),
                        Forms\Components\TextInput::make('branch_slug')
                            ->maxLength(150)
                            ->helperText('URL-friendly name (auto-generated if empty)'),
                        Forms\Components\Textarea::make('address')
                            ->required()
                            ->maxLength(500)
                            ->columnSpanFull(),
                        Forms\Components\TextInput::make('city')
                            ->required()
                            ->maxLength(100),
                        Forms\Components\TextInput::make('district')
                            ->maxLength(100),
                    ])->columns(2),

                Forms\Components\Section::make('Contact Information')
                    ->schema([
                        Forms\Components\TextInput::make('contact_number')
                            ->required()
                            ->tel()
                            ->maxLength(20),
                        Forms\Components\TextInput::make('email')
                            ->email()
                            ->maxLength(255),
                    ])->columns(2),

                Forms\Components\Section::make('Location & Delivery')
                    ->schema([
                        Forms\Components\TextInput::make('latitude')
                            ->required()
                            ->numeric()
                            ->step(0.00000001),
                        Forms\Components\TextInput::make('longitude')
                            ->required()
                            ->numeric()
                            ->step(0.00000001),
                        Forms\Components\TextInput::make('delivery_radius_km')
                            ->required()
                            ->numeric()
                            ->default(10)
                            ->suffix('KM')
                            ->helperText('Delivery radius in kilometers'),
                    ])->columns(3),

                Forms\Components\Section::make('Operating Hours')
                    ->schema([
                        Forms\Components\TimePicker::make('opening_time')
                            ->required()
                            ->default('08:00'),
                        Forms\Components\TimePicker::make('closing_time')
                            ->required()
                            ->default('22:00'),
                    ])->columns(2),

                Forms\Components\Section::make('Weekly Schedule')
                    ->schema([
                        Forms\Components\Toggle::make('is_open_sunday')
                            ->label('Sunday')
                            ->default(true),
                        Forms\Components\Toggle::make('is_open_monday')
                            ->label('Monday')
                            ->default(true),
                        Forms\Components\Toggle::make('is_open_tuesday')
                            ->label('Tuesday')
                            ->default(true),
                        Forms\Components\Toggle::make('is_open_wednesday')
                            ->label('Wednesday')
                            ->default(true),
                        Forms\Components\Toggle::make('is_open_thursday')
                            ->label('Thursday')
                            ->default(true),
                        Forms\Components\Toggle::make('is_open_friday')
                            ->label('Friday')
                            ->default(true),
                        Forms\Components\Toggle::make('is_open_saturday')
                            ->label('Saturday')
                            ->default(true),
                    ])->columns(7),

                Forms\Components\Section::make('Status')
                    ->schema([
                        Forms\Components\Toggle::make('is_active')
                            ->label('Active')
                            ->default(true)
                            ->helperText('Inactive branches will not be visible to customers'),
                    ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('branch_code')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('branch_name')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('city')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('contact_number')
                    ->searchable(),
                Tables\Columns\TextColumn::make('delivery_radius_km')
                    ->suffix(' KM')
                    ->sortable(),
                Tables\Columns\TextColumn::make('opening_time')
                    ->time('H:i'),
                Tables\Columns\TextColumn::make('closing_time')
                    ->time('H:i'),
                Tables\Columns\IconColumn::make('is_active')
                    ->boolean()
                    ->label('Active'),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\TernaryFilter::make('is_active')
                    ->label('Active Status'),
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
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListBranches::route('/'),
            'create' => Pages\CreateBranch::route('/create'),
            'view' => Pages\ViewBranch::route('/{record}'),
            'edit' => Pages\EditBranch::route('/{record}/edit'),
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
