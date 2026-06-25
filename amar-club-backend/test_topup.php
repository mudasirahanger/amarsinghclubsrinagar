<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$user = \App\Models\User::first();

$request = Illuminate\Http\Request::create(
    '/api/wallet/top-up',
    'POST',
    [
        'amount' => 500,
        'payment_method' => 'cash'
    ]
);
$request->headers->set('Accept', 'application/json');
$request->setUserResolver(function () use ($user) {
    return $user;
});

$response = $kernel->handle($request);

echo "Status: " . $response->getStatusCode() . "\n";
echo "Body: " . $response->getContent() . "\n";
