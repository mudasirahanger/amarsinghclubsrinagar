<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\WalletController;

// Public Routes
Route::post('/login', [AuthController::class, 'login']);

Route::get('/system/status', function () {
    return response()->json([
        'maintenance_mode' => \App\Models\AppSetting::getValue('maintenance_mode', 'false') === 'true',
        'minimum_app_version' => \App\Models\AppSetting::getValue('minimum_app_version', '1.0.0'),
        'app_store_url' => \App\Models\AppSetting::getValue('app_store_url', ''),
        'play_store_url' => \App\Models\AppSetting::getValue('play_store_url', ''),
    ]);
});

// Protected Routes (Requires Sanctum Token)
Route::middleware('auth:sanctum')->group(function () {

    // Get the authenticated user's profile
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Update the authenticated user's profile
    Route::post('/user/profile', [AuthController::class, 'updateProfile']);

    Route::post('/update-secret-code', [AuthController::class, 'updateSecretCode']);


    // Wallet Routes
    Route::post('/wallet/top-up', [WalletController::class, 'topUp']);
    Route::post('/wallet/pay', [WalletController::class, 'pay']);
    Route::get('/wallet/history', [WalletController::class, 'history']);


    // Notification Routes
    Route::get('/notifications', function (Request $request) {
        $user = $request->user();
        $notifications = $user->notifications;
        \Log::info("User {$user->id} fetched notifications. Count: " . $notifications->count());
        return response()->json($notifications); // Gets all notifications
    });

    Route::post('/notifications/read', function (Request $request) {
        $request->user()->unreadNotifications->markAsRead(); // Clears the "unread" badge
        return response()->json(['message' => 'Marked as read']);
    });

    Route::post('/user/push-token', function (Request $request) {
        $request->validate([
            'token' => 'required|string',
            'device_os' => 'nullable|string'
        ]);

        $updateData = ['expo_push_token' => $request->token];
        if ($request->has('device_os')) {
            $updateData['device_os'] = $request->device_os;
        }

        $request->user()->update($updateData);
        return response()->json(['message' => 'Token saved']);
    });

    // POS Routes
    Route::get('/pos/menu', [\App\Http\Controllers\Api\POSController::class, 'getMenu']);
    Route::get('/pos/members/search', [\App\Http\Controllers\Api\POSController::class, 'searchMembers']);
    Route::post('/pos/orders/create', [\App\Http\Controllers\Api\POSController::class, 'createOrder']);
    Route::get('/pos/orders/{order_id}/status', [\App\Http\Controllers\Api\POSController::class, 'getOrderStatus']);

    // Member Order Approval
    Route::post('/member/orders/{order_id}/approve', [WalletController::class, 'approveOrder']);
    Route::post('/member/orders/{order_id}/cancel', [WalletController::class, 'cancelOrder']);

    // Logout
    Route::post('/logout', [AuthController::class, 'logout']);

});

