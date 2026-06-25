<?php

namespace App\Filament\Resources\Transactions\Schemas;

use Filament\Schemas\Schema;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Select;

class TransactionForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->schema([
                // UPDATED MEMBER DROPDOWN
                Select::make('user_id')
                    ->relationship('user', 'name')
                    // 1. Make it look nice in the UI: "User Name (Member ID)"
                    ->getOptionLabelFromRecordUsing(fn ($record) => "{$record->name} ({$record->member_id})")
                    // 2. Tell the database to search BOTH columns!
                    ->searchable(['name', 'member_id'])
                    ->label('Club Member')
                    ->preload()
                    ->required(),

                TextInput::make('amount')
                    ->numeric()
                    ->prefix('₹')
                    ->required(),
                    
                TextInput::make('description')
                    ->maxLength(255),
                    
                Select::make('status')
                    ->options([
                        'pending' => 'Pending',
                        'completed' => 'Completed',
                        'failed' => 'Failed',
                    ])
                    ->default('completed')
                    ->required(),
            ]);
    }
}