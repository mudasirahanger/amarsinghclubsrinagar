<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Channels\ExpoPushChannel;

class CustomAnnouncement extends Notification
{
    use Queueable;

    public $title;
    public $message;

    public function __construct(string $title, string $message)
    {
        $this->title = $title;
        $this->message = $message;
    }

    public function via($notifiable): array
    {
        return [ExpoPushChannel::class, 'database'];
    }

    public function toArray($notifiable): array
    {
        return [
            'title' => $this->title,
            'message' => $this->message,
            'type' => 'announcement',
        ];
    }

    public function toExpoPush($notifiable): array
    {
        return [
            'title' => $this->title,
            'body' => $this->message,
            'jsonData' => json_encode([
                'type' => 'announcement',
            ]),
        ];
    }
}
