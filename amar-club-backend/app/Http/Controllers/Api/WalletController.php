<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Transaction;
use App\Services\RazorpayService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Notifications\WalletActivity;

class WalletController extends Controller
{
    public function __construct(
        private readonly RazorpayService $razorpayService
    ) {}

    // --- 1. ADDING FUNDS (CREDIT) ---
    public function topUp(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:100',
            'payment_method' => 'required|in:razorpay,cash',
            'reference_id' => 'required_if:payment_method,razorpay|string|nullable',
        ]);

        $idempotencyKey = $request->header('X-Idempotency-Key');
        if ($idempotencyKey && \Illuminate\Support\Facades\Cache::has('idempotency_' . $idempotencyKey)) {
            return response()->json(\Illuminate\Support\Facades\Cache::get('idempotency_' . $idempotencyKey), 200);
        }

        $user = $request->user();
        $amount = (float) $request->amount;
        $method = $request->payment_method;
        $transactionId = 'TXN-' . strtoupper(Str::random(8));
        $status = ($method === 'cash') ? 'pending' : 'completed';

        if ($method === 'razorpay') {
            $referenceId = $request->reference_id;

            if (Transaction::where('reference_id', $referenceId)
                ->where('status', 'completed')
                ->exists()) {
                return response()->json([
                    'message' => 'This payment has already been processed.',
                ], 409);
            }

            try {
                $this->razorpayService->verifyPayment($referenceId, $amount);
            } catch (\RuntimeException $e) {
                return response()->json(['message' => $e->getMessage()], 402);
            }
        }

        try {
            DB::transaction(function () use ($user, $amount, $method, $request, $transactionId, $status) {
                Transaction::create([
                    'user_id' => $user->id,
                    'transaction_id' => $transactionId,
                    'type' => 'credit',
                    'amount' => $amount,
                    'payment_method' => $method,
                    'status' => $status,
                    'reference_id' => $request->reference_id,
                    'description' => 'Wallet Top-up via ' . ucfirst($method),
                ]);

                if ($status === 'completed') {
                    $user->increment('wallet_balance', $amount);
                }
            });

            $user->refresh();

            if ($status === 'completed') {
                activity()
                    ->causedBy($user)
                    ->event('top_up')
                    ->withProperties(['amount' => $amount, 'method' => $method])
                    ->log('Member added money');

                $user->notify(new WalletActivity([
                    'title' => 'Wallet Top-Up',
                    'message' => 'Successfully added ₹' . number_format($amount) . ' to your club wallet.',
                    'type' => 'topup',
                    'amount' => $amount
                ]));
            } else {
                $user->notify(new WalletActivity([
                    'title' => 'Cash Top-Up Pending',
                    'message' => 'Your request to add ₹' . number_format($amount) . ' is pending admin approval.',
                    'type' => 'topup_pending',
                    'amount' => $amount
                ]));
            }

            $responsePayload = [
                'message' => $method === 'cash'
                    ? 'Cash top-up recorded successfully.'
                    : 'Wallet topped up successfully!',
                'transaction_id' => $transactionId,
                'wallet_balance' => $user->wallet_balance,
            ];

            if ($idempotencyKey) {
                \Illuminate\Support\Facades\Cache::put('idempotency_' . $idempotencyKey, $responsePayload, now()->addHours(24));
            }

            \Illuminate\Support\Facades\Cache::forget('user_' . $user->id . '_transactions');

            return response()->json($responsePayload, 200);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('TopUp Failed: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);

            return response()->json(['message' => 'Transaction failed.', 'error' => $e->getMessage()], 500);
        }
    }

    // --- 2. SPENDING FUNDS (DEBIT) ---
    public function pay(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'description' => 'required|string', 
            'qr_payload' => 'nullable|array',
        ]);

        if ($request->has('qr_payload')) {
            $payload = $request->qr_payload;
            
            if (!isset($payload['data']) || !isset($payload['signature'])) {
                return response()->json(['message' => 'Invalid QR Code data.'], 400);
            }
            
            $dataToSign = json_encode($payload['data']);
            $expectedSignature = hash_hmac('sha256', $dataToSign, config('app.key'));
            
            if (!hash_equals($expectedSignature, $payload['signature'])) {
                return response()->json(['message' => 'QR Code Signature Verification Failed. This QR is forged.'], 403);
            }
        }

        $idempotencyKey = $request->header('X-Idempotency-Key');
        if ($idempotencyKey && \Illuminate\Support\Facades\Cache::has('idempotency_' . $idempotencyKey)) {
            return response()->json(\Illuminate\Support\Facades\Cache::get('idempotency_' . $idempotencyKey), 200);
        }

        $user = $request->user();
        $amount = $request->amount;
        $transactionId = 'TXN-' . strtoupper(Str::random(8));

        try {
            DB::transaction(function () use (&$user, $amount, $request, $transactionId) {
                
                // Lock the user row to prevent double-spend race conditions
                $lockedUser = \App\Models\User::where('id', $user->id)->lockForUpdate()->first();
                
                $currentBalance = $lockedUser->wallet_balance ?? 0;

                // CRITICAL CHECK: Does the user actually have enough money?
                if ($currentBalance < $amount) {
                    throw new \Exception('Insufficient club balance. Please top up your wallet.');
                }

                // 1. Log the transaction
                Transaction::create([
                    'user_id' => $lockedUser->id,
                    'transaction_id' => $transactionId,
                    'type' => 'debit',
                    'amount' => $amount,
                    'payment_method' => 'club_wallet',
                    'status' => 'completed',
                    'description' => $request->description,
                ]);

                // 2. Safely Deduct Balance
                $lockedUser->decrement('wallet_balance', $amount);
                $user = $lockedUser;
            });

            $user->refresh();

            $user->notify(new WalletActivity([
                'title' => 'Payment Successful',
                'message' => 'Paid ₹' . number_format($amount) . ' for ' . $request->description . '.',
                'type' => 'pay',
                'amount' => $amount
            ]));

            $responsePayload = [
                'message' => 'Payment successful!',
                'transaction_id' => $transactionId,
                'wallet_balance' => $user->wallet_balance,
            ];

            if (isset($idempotencyKey)) {
                \Illuminate\Support\Facades\Cache::put('idempotency_' . $idempotencyKey, $responsePayload, now()->addHours(24));
            }

            \Illuminate\Support\Facades\Cache::forget('user_' . $user->id . '_transactions');

            return response()->json($responsePayload, 200);

        } catch (\Exception $e) {
            if ($e->getMessage() === 'Insufficient club balance. Please top up your wallet.') {
                return response()->json([
                    'message' => $e->getMessage()
                ], 400); 
            }
            return response()->json(['message' => 'Payment failed.', 'error' => $e->getMessage()], 500);
        }
    }
    
    // --- 3. TRANSACTION HISTORY ---
    public function history(Request $request)
    {
        $userId = $request->user()->id;
        
        // Removed Cache::remember because Laravel serialization of Eloquent Collections 
        // often causes "__PHP_Incomplete_Class_Name" errors when reading from file/redis cache.
        $transactions = Transaction::where('user_id', $userId)
                        ->orderBy('created_at', 'desc')
                        ->get();
                            
        return response()->json($transactions);
    }

    // --- 4. APPROVE CATERING ORDER ---
    public function approveOrder($order_id, Request $request)
    {
        $idempotencyKey = $request->header('X-Idempotency-Key');
        if ($idempotencyKey && \Illuminate\Support\Facades\Cache::has('idempotency_' . $idempotencyKey)) {
            return response()->json(\Illuminate\Support\Facades\Cache::get('idempotency_' . $idempotencyKey), 200);
        }

        $user = $request->user();
        
        try {
            $transactionId = null;
            DB::transaction(function () use (&$user, $order_id, &$transactionId) {
                $lockedUser = \App\Models\User::where('id', $user->id)->lockForUpdate()->first();
                $lockedOrder = \App\Models\Order::where('id', $order_id)
                                ->where('user_id', $user->id)
                                ->lockForUpdate()
                                ->firstOrFail();

                if ($lockedOrder->status !== 'pending_payment') {
                    throw new \Exception('Order is not in pending state or already paid.');
                }

                $amount = $lockedOrder->total_amount;
                $currentBalance = $lockedUser->wallet_balance ?? 0;

                if ($currentBalance < $amount) {
                    throw new \Exception('Insufficient club balance to pay for this order.');
                }

                $transactionId = 'TXN-' . strtoupper(\Illuminate\Support\Str::random(8));

                $existingTransaction = \App\Models\Transaction::where('reference_id', 'ORD-' . $lockedOrder->id)->first();
                
                if ($existingTransaction) {
                    $existingTransaction->update([
                        'status' => 'completed',
                        'payment_method' => 'club_wallet'
                    ]);
                    $transactionId = $existingTransaction->transaction_id;
                } else {
                    \App\Models\Transaction::create([
                        'user_id' => $lockedUser->id,
                        'transaction_id' => $transactionId,
                        'type' => 'debit',
                        'amount' => $amount,
                        'payment_method' => 'club_wallet',
                        'status' => 'completed',
                        'reference_id' => 'ORD-' . $lockedOrder->id,
                        'description' => 'Catering Order #' . $lockedOrder->id,
                    ]);
                }

                $lockedUser->decrement('wallet_balance', $amount);
                $user = $lockedUser;

                $lockedOrder->update(['status' => 'completed']);
            });

            // Remove the pending payment notification from the database since it's paid
            foreach ($user->notifications()->where('type', \App\Notifications\OrderPendingPayment::class)->get() as $notification) {
                if (isset($notification->data['order_id']) && $notification->data['order_id'] == $order_id) {
                    $notification->delete();
                }
            }

            $user->refresh();

            $user->notify(new WalletActivity([
                'title' => 'Catering Payment Successful',
                'message' => 'Paid ₹' . number_format(\App\Models\Order::find($order_id)->total_amount) . ' for catering.',
                'type' => 'pay',
                'amount' => \App\Models\Order::find($order_id)->total_amount
            ]));

            $responsePayload = [
                'message' => 'Order payment successful!',
                'wallet_balance' => $user->wallet_balance,
                'transaction_id' => $transactionId 
            ];

            if (isset($idempotencyKey)) {
                \Illuminate\Support\Facades\Cache::put('idempotency_' . $idempotencyKey, $responsePayload, now()->addHours(24));
            }

            \Illuminate\Support\Facades\Cache::forget('user_' . $user->id . '_transactions');

            return response()->json($responsePayload, 200);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Payment failed.', 'error' => $e->getMessage()], 400);
        }
    }

    // --- 5. CANCEL CATERING ORDER ---
    public function cancelOrder($order_id, Request $request)
    {
        $user = $request->user();
        try {
            DB::transaction(function () use ($user, $order_id) {
                $lockedOrder = \App\Models\Order::where('id', $order_id)
                                ->where('user_id', $user->id)
                                ->lockForUpdate()
                                ->firstOrFail();

                if ($lockedOrder->status !== 'pending_payment') {
                    throw new \Exception('Order is not in pending state.');
                }

                $lockedOrder->update(['status' => 'cancelled']);
                
                // Update transaction if exists
                $existingTransaction = \App\Models\Transaction::where('reference_id', 'ORD-' . $lockedOrder->id)->first();
                if ($existingTransaction) {
                    $existingTransaction->update(['status' => 'failed', 'description' => 'Cancelled: ' . $existingTransaction->description]);
                }
            });

            // Remove the pending payment notification
            foreach ($user->notifications()->where('type', \App\Notifications\OrderPendingPayment::class)->get() as $notification) {
                if (isset($notification->data['order_id']) && $notification->data['order_id'] == $order_id) {
                    $notification->delete();
                }
            }

            \Illuminate\Support\Facades\Cache::forget('user_' . $user->id . '_transactions');

            return response()->json(['message' => 'Order cancelled successfully.'], 200);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to cancel order.', 'error' => $e->getMessage()], 400);
        }
    }
}