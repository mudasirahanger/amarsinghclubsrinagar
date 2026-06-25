<?php
namespace App\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;

class ExpoPushChannel
{
    public function send($notifiable, Notification $notification)
    {
        // Check if the user actually has a token saved
        if (!$notifiable->expo_push_token) {
            return;
        }

        // Get the push data from our notification class
        $message = $notification->toExpoPush($notifiable);

        // Ping the Expo Server!
        $payload = [
            'to' => $notifiable->expo_push_token,
            'title' => $message['title'],
            'body' => $message['body'],
            'sound' => 'default', // Makes the phone "ding"
            'priority' => 'high'
        ];

        if (isset($message['jsonData'])) {
            $payload['data'] = json_decode($message['jsonData'], true);
        }

        Http::post('https://exp.host/--/api/v2/push/send', $payload);
    }
}