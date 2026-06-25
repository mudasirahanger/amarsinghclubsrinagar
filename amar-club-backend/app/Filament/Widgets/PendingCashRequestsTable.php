<?php

namespace App\Filament\Widgets;

use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;
use App\Models\Transaction;
use App\Notifications\WalletActivity;
use Illuminate\Support\Facades\DB;
use Filament\Notifications\Notification;
use Filament\Support\Colors\Color;

class PendingCashRequestsTable extends BaseWidget
{
    protected static ?int $sort = 2; // Position it below the stats
    protected int | string | array $columnSpan = 'full';
    
    protected static ?string $heading = 'Pending Cash Requests';

    public function table(Table $table): Table
    {
        return $table
            ->query(
                Transaction::query()
                    ->where('type', 'credit')
                    ->where('payment_method', 'cash')
                    ->where('status', 'pending')
                    ->with('user')
            )
            ->columns([
                Tables\Columns\TextColumn::make('transaction_id')
                    ->label('Transaction ID')
                    ->searchable()
                    ->sortable(),
                    
                Tables\Columns\TextColumn::make('user.name')
                    ->label('Member Name')
                    ->searchable()
                    ->sortable(),
                    
                Tables\Columns\TextColumn::make('user.member_id')
                    ->label('Member ID')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('amount')
                    ->label('Amount')
                    ->money('INR')
                    ->sortable(),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Requested At')
                    ->dateTime('d M Y, h:i A')
                    ->sortable(),
            ])
            ->actions([
                \Filament\Actions\Action::make('approve')
                    ->label('Approve')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->requiresConfirmation()
                    ->modalHeading('Approve Cash Deposit')
                    ->modalDescription('Are you sure you want to approve this cash deposit? The amount will be added to the member\'s wallet immediately.')
                    ->modalSubmitActionLabel('Yes, Approve')
                    ->action(function (Transaction $record) {
                        try {
                            DB::transaction(function () use ($record) {
                                // 1. Lock user to prevent race conditions
                                $user = \App\Models\User::where('id', $record->user_id)->lockForUpdate()->first();
                                
                                // 2. Update transaction status
                                $record->update(['status' => 'completed']);
                                
                                // 3. Increment wallet balance
                                $user->increment('wallet_balance', $record->amount);
                                
                                // 4. Refresh user
                                $user->refresh();
                                
                                // 5. Send Notification
                                $user->notify(new WalletActivity([
                                    'title' => 'Cash Top-Up Approved',
                                    'message' => 'Your cash deposit of ₹' . number_format($record->amount) . ' has been approved and added to your wallet.',
                                    'type' => 'topup',
                                    'amount' => $record->amount
                                ]));
                            });

                            Notification::make()
                                ->title('Cash deposit approved successfully!')
                                ->success()
                                ->send();

                        } catch (\Exception $e) {
                            Notification::make()
                                ->title('Approval failed')
                                ->body($e->getMessage())
                                ->danger()
                                ->send();
                        }
                    }),
            ]);
    }
}
