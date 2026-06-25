<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$user = App\Models\User::find(1);

$request = Illuminate\Http\Request::create('/admin', 'GET');
$request->setUserResolver(function () use ($user) {
    return $user;
});

// Since auth is stateful, we can just log the user in via auth
auth()->login($user);

$response = $kernel->handle($request);
echo "Status: " . $response->getStatusCode() . "\n";
if ($response->getStatusCode() === 403) {
    echo "Content: " . substr($response->getContent(), 0, 500) . "\n";
}
