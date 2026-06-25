<?php

namespace App\Filament\Resources\Users\RelationManagers;

use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables\Table;

// ✅ Proper imports
use Filament\Tables\Columns\TextColumn;

class TransactionsRelationManager extends RelationManager
{
    protected static string $relationship = 'transactions';

    protected static ?string $title = 'Wallet Activity History';

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('id')

            ->columns([
                // Transaction ID
                TextColumn::make('id')
                    ->label('Trans ID')
                    ->prefix('#')
                    ->sortable()
                    ->weight('bold'),

                // CR / DR Badge
                TextColumn::make('type')
                    ->label('Type')
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'credit' => 'CR (Top-Up)',
                        'debit'  => 'DR (Payment)',
                        default  => strtoupper($state),
                    })
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'credit' => 'success',
                        'debit' => 'danger',
                        default => 'warning',
                    }),

                // Amount
                TextColumn::make('amount')
                    ->label('Amount')
                    ->money('INR')
                    ->weight('bold')
                    ->sortable(),

                // Details
                TextColumn::make('description')
                    ->label('Details')
                    ->limit(40),

                // Status
                TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'completed' => 'success',
                        'pending' => 'warning',
                        'failed' => 'danger',
                        default => 'gray',
                    }),

                // Date
                TextColumn::make('created_at')
                    ->label('Date & Time')
                    ->dateTime('M j, Y g:i A')
                    ->sortable(),
            ])

            ->filters([
                //
            ])

            ->headerActions([
                // (optional future actions)
            ])

            ->recordActions([
                // intentionally empty (good practice 👍)
            ])

            // ->bulkActions([
            //     // keep empty or add later
            // ])

            ->defaultSort('created_at', 'desc');
    }
}