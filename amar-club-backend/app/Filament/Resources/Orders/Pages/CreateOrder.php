<?php

namespace App\Filament\Resources\Orders\Pages;

use App\Filament\Resources\Orders\OrderResource;
use Filament\Resources\Pages\CreateRecord;

class CreateOrder extends CreateRecord
{
    protected static string $resource = OrderResource::class;

    public function mount(): void
    {
        parent::mount();

        if (session()->has('order_form_draft')) {
            $this->form->fill(session()->get('order_form_draft'));
        }
    }

    public function updated($propertyName)
    {
        // Save the current form state to the session whenever a field updates
        if (str_starts_with($propertyName, 'data')) {
            session()->put('order_form_draft', $this->data);
        }
    }

    protected function afterCreate(): void
    {
        session()->forget('order_form_draft');

        /** @var \App\Models\Order $order */
        $order = $this->record;

        if ($order->status !== 'draft') {
            \App\Models\Transaction::create([
                'user_id' => $order->user_id,
                'transaction_id' => 'TXN-' . strtoupper(uniqid()),
                'type' => 'debit',
                'amount' => $order->total_amount,
                'payment_method' => 'KOT', // Pending selection
                'status' => 'pending',
                'reference_id' => 'ORD-' . $order->id,
                'description' => 'Pending payment for KOT Order #' . $order->id,
            ]);
            
            // Notify the user via Expo Push Notification
            if ($order->user) {
                $order->user->notify(new \App\Notifications\OrderPendingPayment($order));
            }
        }

        \Filament\Notifications\Notification::make()
            ->title('Order Created')
            ->body("A new order (ID: {$order->id}) for ₹{$order->total_amount} has been placed. Transaction is pending.")
            ->success()
            ->sendToDatabase($order->user);
    }
}
