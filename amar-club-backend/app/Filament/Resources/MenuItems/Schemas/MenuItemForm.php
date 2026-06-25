<?php

namespace App\Filament\Resources\MenuItems\Schemas;

use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class MenuItemForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('name')
                    ->required(),
                \Filament\Forms\Components\Select::make('category_id')
                    ->relationship('category', 'name')
                    ->required()
                    ->createOptionForm([
                        TextInput::make('name')
                            ->required()
                            ->maxLength(255),
                        \Filament\Forms\Components\Textarea::make('description')
                            ->maxLength(65535),
                    ]),
                TextInput::make('price')
                    ->required()
                    ->numeric()
                    ->prefix('₹'),
                TextInput::make('tax_gst')
                    ->label('Tax (GST %)')
                    ->numeric()
                    ->required()
                    ->default(0)
                    ->prefix('%'),
                TextInput::make('discount')
                    ->label('Discount (%)')
                    ->numeric()
                    ->required()
                    ->default(0)
                    ->prefix('%'),
                Toggle::make('is_available')
                    ->required(),
                FileUpload::make('image_url')
                    ->image(),
            ]);
    }
}
