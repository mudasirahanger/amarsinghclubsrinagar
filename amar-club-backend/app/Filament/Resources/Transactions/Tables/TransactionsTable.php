<?php

namespace App\Filament\Resources\Transactions\Tables;

use Filament\Tables\Table;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;

// ✅ Correct namespaces (v5)
use Filament\Actions\Action;
use Filament\Actions\EditAction;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;

class TransactionsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('user.name')
                    ->label('Member'),

                TextColumn::make('type')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'credit' => 'success',
                        'debit' => 'danger',
                        default => 'warning',
                    }),

                TextColumn::make('amount')
                    ->money('INR')
                    ->weight('bold'),

                TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'completed' => 'success',
                        'pending' => 'warning',
                        default => 'gray',
                    }),
            ])

            ->filters([
                SelectFilter::make('status')
                    ->options([
                        'completed' => 'Completed',
                        'pending' => 'Pending',
                    ]),
            ])

            ->recordActions([
                // ✅ FIXED: use Action instead of CreateAction
                Action::make('approve')
                    ->label('Approve Cash')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->requiresConfirmation()
                    ->visible(fn ($record) => $record->status === 'pending' && $record->type === 'credit')
                    ->action(function ($record) {
                        $record->update(['status' => 'completed']);

                        // Safely increment user balance
                        $record->user->increment('wallet_balance', $record->amount);
                        
                        // Send push notification to the member's device
                        $record->user->notify(new \App\Notifications\WalletActivity([
                            'title' => 'Cash Approved',
                            'message' => 'Your cash top-up of ₹' . number_format($record->amount) . ' has been approved.',
                            'type' => 'topup_approved',
                            'amount' => $record->amount
                        ]));

                        \Filament\Notifications\Notification::make()
                            ->title('Approved!')
                            ->success()
                            ->send();
                    }),

                // ✅ Correct Edit Action
                EditAction::make(),
            ])
            ->bulkActions([
                \Filament\Actions\BulkActionGroup::make([
                    \Filament\Actions\DeleteBulkAction::make(),
                    \pxlrbt\FilamentExcel\Actions\ExportBulkAction::make(),
                ]),
            ]);
    }
}