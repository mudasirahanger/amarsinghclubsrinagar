<?php

namespace App\Filament\Resources\Users\Tables;

use Filament\Tables\Table;
use Filament\Tables\Columns\TextColumn;

// ✅ Actions (v5)
use Filament\Actions\Action;
use Filament\Actions\EditAction;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\DissociateBulkAction;

// ✅ Forms
use Filament\Forms\Components\TextInput;

// ✅ Notifications
use Filament\Notifications\Notification;

class UsersTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('member_id')
                    ->label('Member ID')
                    ->searchable()
                    ->sortable()
                    ->weight('bold'),

                TextColumn::make('name')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('email')
                    ->searchable(),

                TextColumn::make('wallet_balance')
                    ->label('Current Balance')
                    ->money('INR')
                    ->sortable()
                    ->badge()
                    ->color(fn ($state): string => $state < 500 ? 'danger' : 'success'),

                TextColumn::make('created_at')
                    ->label('Joined')
                    ->date()
                    ->sortable(),
            ])

            ->filters([
                //
            ])

            ->recordActions([
                // ✅ FIXED: Custom Action (v5)
                Action::make('adjust_balance')
                    ->label('Adjust Balance')
                    ->icon('heroicon-o-currency-rupee')
                    ->color('warning')
                    ->form([
                        TextInput::make('amount')
                            ->label('Amount to Add/Remove')
                            ->numeric()
                            ->required()
                            ->helperText('Use negative number to deduct funds'),
                    ])
                    ->action(function ($record, array $data) {
                        $amount = $data['amount'];
                        $type = $amount >= 0 ? 'credit' : 'debit';
                        
                        // Create transaction log
                        \App\Models\Transaction::create([
                            'user_id' => $record->id,
                            'transaction_id' => 'TXN-' . strtoupper(\Illuminate\Support\Str::random(8)),
                            'type' => $type,
                            'amount' => abs($amount),
                            'payment_method' => 'admin_adjustment',
                            'status' => 'completed',
                            'description' => 'Manual balance adjustment by Admin',
                        ]);

                        $record->wallet_balance += $amount;
                        $record->save();

                        // Notify user
                        $record->notify(new \App\Notifications\WalletActivity([
                            'title' => 'Balance Adjusted',
                            'message' => 'Your wallet balance was manually adjusted by ₹' . number_format(abs($amount)) . ' (' . ucfirst($type) . ').',
                            'type' => 'adjustment',
                            'amount' => abs($amount)
                        ]));

                        Notification::make()
                            ->title('Wallet Balance Updated!')
                            ->success()
                            ->send();
                    }),

                // ✅ Edit Action
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DissociateBulkAction::make(),
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}