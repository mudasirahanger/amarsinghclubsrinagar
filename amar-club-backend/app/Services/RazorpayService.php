<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RazorpayService
{
    /**
     * Verify a Razorpay payment ID against the Razorpay API.
     *
     * @throws \RuntimeException
     */
    public function verifyPayment(string $paymentId, float $expectedAmountInRupees): array
    {
        $paymentId = trim($paymentId);

        if ($paymentId === '' || ! preg_match('/^pay_[A-Za-z0-9]+$/', $paymentId)) {
            throw new \RuntimeException('Invalid payment reference.');
        }

        $keyId = config('razorpay.key_id');
        $keySecret = config('razorpay.key_secret');

        if (empty($keyId) || empty($keySecret)) {
            if (app()->environment(['local', 'testing']) && config('razorpay.skip_verification')) {
                return [
                    'id' => $paymentId,
                    'status' => 'captured',
                    'amount' => (int) round($expectedAmountInRupees * 100),
                ];
            }

            throw new \RuntimeException('Payment gateway is not configured.');
        }

        $response = Http::withBasicAuth($keyId, $keySecret)
            ->timeout(15)
            ->get("https://api.razorpay.com/v1/payments/{$paymentId}");

        if (! $response->successful()) {
            Log::warning('Razorpay verification failed', [
                'payment_id' => $paymentId,
                'status' => $response->status(),
            ]);

            throw new \RuntimeException('Unable to verify payment with Razorpay.');
        }

        $payment = $response->json();

        $status = $payment['status'] ?? null;
        if (! in_array($status, ['captured', 'authorized'], true)) {
            throw new \RuntimeException('Payment has not been completed.');
        }

        $expectedPaise = (int) round($expectedAmountInRupees * 100);
        $paidPaise = (int) ($payment['amount'] ?? 0);

        if ($paidPaise !== $expectedPaise) {
            throw new \RuntimeException('Payment amount does not match the requested top-up amount.');
        }

        return $payment;
    }
}
