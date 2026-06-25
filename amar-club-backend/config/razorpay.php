<?php

return [
    'key_id' => env('RAZORPAY_KEY_ID'),
    'key_secret' => env('RAZORPAY_KEY_SECRET'),
    // Only enable in local/testing — never in production
    'skip_verification' => env('RAZORPAY_SKIP_VERIFICATION', false),
];
