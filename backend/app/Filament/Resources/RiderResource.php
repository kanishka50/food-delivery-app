<?php

namespace App\Filament\Resources;

use App\Filament\Resources\RiderResource\Pages;
use App\Models\Rider;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;
use Illuminate\Support\Facades\Hash;

class RiderResource extends Resource
{
    protected static ?string $model = Rider::class;

    protected static ?string $navigationIcon = 'heroicon-o-truck';

    protected static ?string $navigationGroup = 'Delivery Management';

    protected static ?int $navigationSort = 1;

    protected static ?string $recordTitleAttribute = 'full_name';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Personal Information')
                    ->schema([
                        Forms\Components\TextInput::make('rider_id')
                            ->label('Rider ID')
                            ->maxLength(20)
                            ->helperText('Auto-generated if left empty')
                            ->disabled(fn ($context) => $context === 'edit'),

                        Forms\Components\TextInput::make('full_name')
                            ->required()
                            ->maxLength(150),

                        Forms\Components\TextInput::make('phone_number')
                            ->tel()
                            ->required()
                            ->unique(ignoreRecord: true)
                            ->maxLength(20)
                            ->helperText('Used for login'),

                        Forms\Components\TextInput::make('password')
                            ->password()
                            ->required(fn ($context) => $context === 'create')
                            ->dehydrateStateUsing(fn ($state) => !empty($state) ? Hash::make($state) : null)
                            ->dehydrated(fn ($state) => filled($state))
                            ->maxLength(255)
                            ->helperText('Leave empty to keep current password (edit mode)'),

                        Forms\Components\TextInput::make('email')
                            ->email()
                            ->maxLength(255),

                        Forms\Components\FileUpload::make('profile_image')
                            ->image()
                            ->directory('riders')
                            ->maxSize(2048)
                            ->columnSpanFull(),
                    ])->columns(2),

                Forms\Components\Section::make('Vehicle Information')
                    ->schema([
                        Forms\Components\Select::make('vehicle_type')
                            ->options([
                                'bicycle' => 'Bicycle',
                                'motorcycle' => 'Motorcycle',
                                'scooter' => 'Scooter',
                                'car' => 'Car',
                            ])
                            ->default('motorcycle')
                            ->required(),

                        Forms\Components\TextInput::make('vehicle_number')
                            ->maxLength(50)
                            ->helperText('Vehicle registration number'),

                        Forms\Components\TextInput::make('license_number')
                            ->maxLength(100)
                            ->helperText('Driving license number'),
                    ])->columns(3),

                Forms\Components\Section::make('Branch Assignment')
                    ->schema([
                        Forms\Components\Select::make('assigned_branch_id')
                            ->relationship('assignedBranch', 'branch_name')
                            ->searchable()
                            ->preload()
                            ->helperText('Assign rider to a specific branch'),
                    ]),

                Forms\Components\Section::make('Status & Availability')
                    ->schema([
                        Forms\Components\Toggle::make('is_active')
                            ->label('Active')
                            ->default(true)
                            ->helperText('Deactivate to prevent rider from logging in'),

                        Forms\Components\Toggle::make('is_available')
                            ->label('Available for Orders')
                            ->default(false)
                            ->helperText('Can receive new orders'),

                        Forms\Components\Toggle::make('is_online')
                            ->label('Currently Online')
                            ->default(false)
                            ->disabled()
                            ->helperText('Set automatically when rider logs in'),
                    ])->columns(3),

                Forms\Components\Section::make('Statistics')
                    ->schema([
                        Forms\Components\TextInput::make('total_deliveries')
                            ->numeric()
                            ->default(0)
                            ->disabled()
                            ->helperText('Total completed deliveries'),

                        Forms\Components\TextInput::make('average_rating')
                            ->numeric()
                            ->default(0.00)
                            ->disabled()
                            ->helperText('Average customer rating'),

                        Forms\Components\TextInput::make('total_ratings')
                            ->numeric()
                            ->default(0)
                            ->disabled()
                            ->helperText('Number of ratings received'),

                        Forms\Components\DateTimePicker::make('last_login_at')
                            ->disabled()
                            ->helperText('Last login timestamp'),
                    ])->columns(4)
                    ->visible(fn ($context) => $context === 'edit'),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\ImageColumn::make('profile_image')
                    ->circular()
                    ->defaultImageUrl(url('/images/default-avatar.png')),

                Tables\Columns\TextColumn::make('rider_id')
                    ->label('Rider ID')
                    ->searchable()
                    ->sortable()
                    ->badge()
                    ->color('primary'),

                Tables\Columns\TextColumn::make('full_name')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('phone_number')
                    ->searchable()
                    ->icon('heroicon-o-phone'),

                Tables\Columns\TextColumn::make('assignedBranch.branch_name')
                    ->label('Branch')
                    ->searchable()
                    ->sortable()
                    ->badge()
                    ->color('success'),

                Tables\Columns\TextColumn::make('vehicle_type')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'bicycle' => 'gray',
                        'motorcycle' => 'warning',
                        'scooter' => 'info',
                        'car' => 'success',
                        default => 'gray',
                    }),

                Tables\Columns\IconColumn::make('is_online')
                    ->label('Online')
                    ->boolean()
                    ->sortable(),

                Tables\Columns\IconColumn::make('is_available')
                    ->label('Available')
                    ->boolean()
                    ->sortable(),

                Tables\Columns\IconColumn::make('is_active')
                    ->label('Active')
                    ->boolean()
                    ->sortable(),

                Tables\Columns\TextColumn::make('total_deliveries')
                    ->label('Deliveries')
                    ->numeric()
                    ->sortable()
                    ->badge()
                    ->color('info'),

                Tables\Columns\TextColumn::make('average_rating')
                    ->label('Rating')
                    ->numeric(2)
                    ->sortable()
                    ->icon('heroicon-o-star'),

                Tables\Columns\TextColumn::make('last_login_at')
                    ->label('Last Login')
                    ->dateTime()
                    ->sortable()
                    ->since()
                    ->toggleable(isToggledHiddenByDefault: true),

                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('assigned_branch_id')
                    ->relationship('assignedBranch', 'branch_name')
                    ->label('Branch'),

                Tables\Filters\SelectFilter::make('vehicle_type')
                    ->options([
                        'bicycle' => 'Bicycle',
                        'motorcycle' => 'Motorcycle',
                        'scooter' => 'Scooter',
                        'car' => 'Car',
                    ]),

                Tables\Filters\TernaryFilter::make('is_active')
                    ->label('Active'),

                Tables\Filters\TernaryFilter::make('is_online')
                    ->label('Online'),

                Tables\Filters\TernaryFilter::make('is_available')
                    ->label('Available'),

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

                    Tables\Actions\BulkAction::make('activate')
                        ->label('Activate')
                        ->icon('heroicon-o-check-circle')
                        ->color('success')
                        ->action(fn ($records) => $records->each->update(['is_active' => true]))
                        ->deselectRecordsAfterCompletion(),

                    Tables\Actions\BulkAction::make('deactivate')
                        ->label('Deactivate')
                        ->icon('heroicon-o-x-circle')
                        ->color('danger')
                        ->action(fn ($records) => $records->each->update(['is_active' => false]))
                        ->deselectRecordsAfterCompletion(),
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
            'index' => Pages\ListRiders::route('/'),
            'create' => Pages\CreateRider::route('/create'),
            'edit' => Pages\EditRider::route('/{record}/edit'),
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
