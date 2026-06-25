<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderPendingPayment extends Notification
{
    use Queueable;

    public $order;

    public function __construct($order)
    {
        $this->order = $order;
    }

    public function via(object $notifiable): array
    {
        return ['database', \App\Channels\ExpoPushChannel::class];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Payment Required',
            'message' => 'Your order #' . $this->order->id . ' for ₹' . number_format($this->order->total_amount) . ' is ready. Please pay your bill.',
            'type' => 'order_pending_payment',
            'order_id' => $this->order->id,
            'amount' => $this->order->total_amount
        ];
    }

    public function toExpoPush(object $notifiable): array
    {
        return [
            'title' => 'Payment Required',
            'body' => 'Your order #' . $this->order->id . ' for ₹' . number_format($this->order->total_amount) . ' is ready. Please pay your bill.',
            'jsonData' => json_encode([
                'type' => 'debit_request',
                'order_id' => $this->order->id,
                'amount' => $this->order->total_amount
            ])
        ];
    }
}
