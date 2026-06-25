<?php

namespace App\Filament\Resources\Users\Schemas;

use Filament\Schemas\Schema;
use Filament\Forms\Components\TextInput;

class UserForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->schema([
                TextInput::make('name')
                    ->required()
                    ->maxLength(255),

                TextInput::make('email')
                    ->email()
                    ->required()
                    ->maxLength(255),

                TextInput::make('member_id')
                    ->label('Club Member ID')
                    ->required()
                    ->unique(ignoreRecord: true) // Prevents duplicate IDs!
                    ->maxLength(255),

                // Only show password field when creating a new user, hide it on edit
                TextInput::make('password')
                    ->password()
                    ->required(fn (string $context): bool => $context === 'create')
                    ->dehydrated(fn ($state) => filled($state)),

                TextInput::make('wallet_balance')
                    ->numeric()
                    ->prefix('₹')
                    ->default(0),
            ]);
    }
}