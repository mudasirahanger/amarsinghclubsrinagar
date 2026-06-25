<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Channels\ExpoPushChannel;

class WalletActivity extends Notification
{
    use Queueable;

    public $transactionData;

    public function __construct($transactionData)
    {
        $this->transactionData = $transactionData;
    }

    // Tell Laravel to use BOTH the database AND our new Expo Channel
    public function via($notifiable): array
    {
        return ['database', ExpoPushChannel::class];
    }

    // For the Database Notification Center
    public function toArray($notifiable): array
    {
        return [
            'title' => $this->transactionData['title'],
            'message' => $this->transactionData['message'],
            'type' => $this->transactionData['type'],
            'amount' => $this->transactionData['amount']
        ];
    }

    // For the Lock Screen Push Notification!
    public function toExpoPush($notifiable): array
    {
        return [
            'title' => 'Amar Singh Club: ' . $this->transactionData['title'],
            'body' => $this->transactionData['message'],
            'jsonData' => json_encode([
                'type' => $this->transactionData['type'] ?? 'info',
                'amount' => $this->transactionData['amount'] ?? 0,
                'order_id' => $this->transactionData['order_id'] ?? null,
            ]),
        ];
    }
}