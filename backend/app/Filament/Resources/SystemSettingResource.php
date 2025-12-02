<?php

namespace App\Filament\Resources;

use App\Filament\Resources\SystemSettingResource\Pages;
use App\Models\SystemSetting;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class SystemSettingResource extends Resource
{
    protected static ?string $model = SystemSetting::class;

    protected static ?string $navigationIcon = 'heroicon-o-cog-6-tooth';

    protected static ?string $navigationGroup = 'Settings';

    protected static ?int $navigationSort = 10;

    protected static ?string $recordTitleAttribute = 'setting_key';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Setting Details')
                    ->schema([
                        Forms\Components\TextInput::make('setting_key')
                            ->required()
                            ->maxLength(100)
                            ->disabled(fn ($record) => $record !== null)
                            ->helperText('Unique key for this setting'),
                        Forms\Components\Select::make('setting_type')
                            ->options([
                                'string' => 'String',
                                'number' => 'Number',
                                'boolean' => 'Boolean',
                                'json' => 'JSON',
                            ])
                            ->required()
                            ->default('string')
                            ->reactive(),
                        Forms\Components\TextInput::make('setting_value')
                            ->required()
                            ->maxLength(65535)
                            ->visible(fn (Forms\Get $get) => in_array($get('setting_type'), ['string', 'number', null])),
                        Forms\Components\Toggle::make('setting_value')
                            ->visible(fn (Forms\Get $get) => $get('setting_type') === 'boolean')
                            ->dehydrateStateUsing(fn ($state) => $state ? 'true' : 'false'),
                        Forms\Components\Textarea::make('setting_value')
                            ->visible(fn (Forms\Get $get) => $get('setting_type') === 'json')
                            ->helperText('Enter valid JSON'),
                        Forms\Components\Textarea::make('description')
                            ->maxLength(255)
                            ->columnSpanFull(),
                    ])->columns(2),

                Forms\Components\Section::make('Visibility')
                    ->schema([
                        Forms\Components\Toggle::make('is_public')
                            ->label('Public')
                            ->helperText('Public settings are visible to the frontend'),
                        Forms\Components\Toggle::make('is_editable')
                            ->label('Editable')
                            ->default(true)
                            ->helperText('Non-editable settings cannot be modified'),
                    ])->columns(2),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('setting_key')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('setting_value')
                    ->limit(50)
                    ->searchable(),
                Tables\Columns\BadgeColumn::make('setting_type')
                    ->colors([
                        'primary' => 'string',
                        'success' => 'number',
                        'warning' => 'boolean',
                        'info' => 'json',
                    ]),
                Tables\Columns\TextColumn::make('description')
                    ->limit(30)
                    ->toggleable(),
                Tables\Columns\IconColumn::make('is_public')
                    ->boolean()
                    ->label('Public'),
                Tables\Columns\IconColumn::make('is_editable')
                    ->boolean()
                    ->label('Editable'),
                Tables\Columns\TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\TernaryFilter::make('is_public')
                    ->label('Public'),
                Tables\Filters\SelectFilter::make('setting_type')
                    ->options([
                        'string' => 'String',
                        'number' => 'Number',
                        'boolean' => 'Boolean',
                        'json' => 'JSON',
                    ]),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
            ])
            ->bulkActions([
                //
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
            'index' => Pages\ListSystemSettings::route('/'),
            'edit' => Pages\EditSystemSetting::route('/{record}/edit'),
        ];
    }

    public static function canCreate(): bool
    {
        return false;
    }

    public static function canDelete($record): bool
    {
        return false;
    }
}
