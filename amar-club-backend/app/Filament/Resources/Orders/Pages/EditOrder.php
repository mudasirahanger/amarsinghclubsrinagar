<?php

namespace App\Filament\Resources\Orders\Pages;

use App\Filament\Resources\Orders\OrderResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditOrder extends EditRecord
{
    protected static string $resource = OrderResource::class;

    protected function getHeaderActions(): array
    {
        return [
            \Filament\Actions\Action::make('archive')
                ->label('Delete')
                ->icon('heroicon-m-trash')
                ->color('danger')
                ->requiresConfirmation()
                ->modalHeading('Archive Order')
                ->modalDescription('Are you sure you want to delete this order? It will be archived.')
                ->modalSubmitActionLabel('Yes, delete it')
                ->action(function (\App\Models\Order $record) {
                    $record->update(['status' => 'archived']);
                    \App\Models\Transaction::where('reference_id', 'ORD-' . $record->id)->get()->each->delete();
                    if ($record->user) {
                        foreach ($record->user->notifications as $notification) {
                            if (isset($notification->data['order_id']) && $notification->data['order_id'] == $record->id) {
                                $notification->delete();
                            }
                        }
                    }
                    \Filament\Notifications\Notification::make()->title('Order archived')->success()->send();
                    return redirect(\App\Filament\Resources\Orders\OrderResource::getUrl('index'));
                }),
        ];
    }

    protected function afterSave(): void
    {
        /** @var \App\Models\Order $order */
        $order = $this->record;

        $transaction = \App\Models\Transaction::where('reference_id', 'ORD-' . $order->id)->first();
        
        if ($transaction) {
            $transaction->update([
                'amount' => $order->total_amount,
                'status' => $order->status === 'completed' ? 'completed' : ($order->status === 'cancelled' ? 'cancelled' : 'pending'),
            ]);
        } elseif ($order->status !== 'draft') {
            \App\Models\Transaction::create([
                'user_id' => $order->user_id,
                'transaction_id' => 'TXN-' . strtoupper(uniqid()),
                'type' => 'debit',
                'amount' => $order->total_amount,
                'payment_method' => 'KOT', // Pending selection
                'status' => $order->status === 'completed' ? 'completed' : 'pending',
                'reference_id' => 'ORD-' . $order->id,
                'description' => 'Pending payment for KOT Order #' . $order->id,
            ]);
            
            // Notify the user via Expo Push Notification if it's pending payment
            if ($order->status === 'pending_payment' && $order->user) {
                $order->user->notify(new \App\Notifications\OrderPendingPayment($order));
            }
        }
    }
}
