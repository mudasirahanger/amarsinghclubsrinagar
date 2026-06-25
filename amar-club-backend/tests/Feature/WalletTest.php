<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;
use App\Models\User;
use App\Models\Transaction;

class WalletTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'razorpay.key_id' => 'rzp_test_key',
            'razorpay.key_secret' => 'test_secret',
            'razorpay.skip_verification' => false,
        ]);
    }

    public function test_user_can_top_up_via_razorpay_when_payment_is_verified()
    {
        Http::fake([
            'api.razorpay.com/v1/payments/pay_abc123' => Http::response([
                'id' => 'pay_abc123',
                'status' => 'captured',
                'amount' => 50000,
            ], 200),
        ]);

        $user = User::factory()->create([
            'member_id' => 'ASC-1001',
            'wallet_balance' => 0,
        ]);

        $response = $this->actingAs($user)->postJson('/api/wallet/top-up', [
            'amount' => 500,
            'payment_method' => 'razorpay',
            'reference_id' => 'pay_abc123',
        ]);

        $response->assertStatus(200)
                 ->assertJson(['message' => 'Wallet topped up successfully!']);

        $this->assertEquals(500, $user->fresh()->wallet_balance);
        $this->assertDatabaseHas('transactions', [
            'user_id' => $user->id,
            'amount' => 500,
            'type' => 'credit',
            'status' => 'completed',
            'reference_id' => 'pay_abc123',
        ]);
    }

    public function test_razorpay_top_up_rejects_unverified_payment()
    {
        Http::fake([
            'api.razorpay.com/v1/payments/pay_fake123' => Http::response([
                'error' => ['description' => 'Payment not found'],
            ], 404),
        ]);

        $user = User::factory()->create([
            'member_id' => 'ASC-1006',
            'wallet_balance' => 0,
        ]);

        $response = $this->actingAs($user)->postJson('/api/wallet/top-up', [
            'amount' => 500,
            'payment_method' => 'razorpay',
            'reference_id' => 'pay_fake123',
        ]);

        $response->assertStatus(402);
        $this->assertEquals(0, $user->fresh()->wallet_balance);
    }

    public function test_razorpay_top_up_rejects_duplicate_reference()
    {
        Http::fake([
            'api.razorpay.com/v1/payments/pay_dup123' => Http::response([
                'id' => 'pay_dup123',
                'status' => 'captured',
                'amount' => 50000,
            ], 200),
        ]);

        $user = User::factory()->create([
            'member_id' => 'ASC-1007',
            'wallet_balance' => 500,
        ]);

        Transaction::create([
            'user_id' => $user->id,
            'transaction_id' => 'TXN-EXISTING1',
            'type' => 'credit',
            'amount' => 500,
            'payment_method' => 'razorpay',
            'status' => 'completed',
            'reference_id' => 'pay_dup123',
            'description' => 'Existing top-up',
        ]);

        $response = $this->actingAs($user)->postJson('/api/wallet/top-up', [
            'amount' => 500,
            'payment_method' => 'razorpay',
            'reference_id' => 'pay_dup123',
        ]);

        $response->assertStatus(409);
        $this->assertEquals(500, $user->fresh()->wallet_balance);
    }

    public function test_cash_top_up_is_pending()
    {
        $user = User::factory()->create([
            'member_id' => 'ASC-1002',
            'wallet_balance' => 0,
        ]);

        $response = $this->actingAs($user)->postJson('/api/wallet/top-up', [
            'amount' => 500,
            'payment_method' => 'cash',
        ]);

        $response->assertStatus(200)
                 ->assertJson(['message' => 'Cash top-up recorded successfully.']);

        $this->assertEquals(0, $user->fresh()->wallet_balance);
        $this->assertDatabaseHas('transactions', [
            'user_id' => $user->id,
            'amount' => 500,
            'type' => 'credit',
            'status' => 'pending',
        ]);
    }

    public function test_user_can_pay_with_sufficient_balance_and_valid_qr()
    {
        $user = User::factory()->create([
            'member_id' => 'ASC-1003',
            'wallet_balance' => 1000,
        ]);

        $payload = [
            'type' => 'table_payment',
            'table' => 'Table 5',
            'timestamp' => now()->timestamp,
        ];

        $dataToSign = json_encode($payload);
        $signature = hash_hmac('sha256', $dataToSign, config('app.key'));

        $response = $this->actingAs($user)->postJson('/api/wallet/pay', [
            'amount' => 300,
            'description' => 'Payment for Table 5',
            'qr_payload' => [
                'prefix' => 'AMARSINGHCLUB',
                'data' => $payload,
                'signature' => $signature,
            ],
        ]);

        $response->assertStatus(200)
                 ->assertJson(['message' => 'Payment successful!']);

        $this->assertEquals(700, $user->fresh()->wallet_balance);
    }

    public function test_user_cannot_pay_with_invalid_qr_signature()
    {
        $user = User::factory()->create([
            'member_id' => 'ASC-1004',
            'wallet_balance' => 1000,
        ]);

        $payload = [
            'type' => 'table_payment',
            'table' => 'Table 5',
        ];

        $response = $this->actingAs($user)->postJson('/api/wallet/pay', [
            'amount' => 300,
            'description' => 'Payment for Table 5',
            'qr_payload' => [
                'prefix' => 'AMARSINGHCLUB',
                'data' => $payload,
                'signature' => 'invalid_signature_123',
            ],
        ]);

        $response->assertStatus(403)
                 ->assertJson(['message' => 'QR Code Signature Verification Failed. This QR is forged.']);

        $this->assertEquals(1000, $user->fresh()->wallet_balance);
    }

    public function test_user_cannot_pay_with_insufficient_balance()
    {
        $user = User::factory()->create([
            'member_id' => 'ASC-1005',
            'wallet_balance' => 100,
        ]);

        $response = $this->actingAs($user)->postJson('/api/wallet/pay', [
            'amount' => 500,
            'description' => 'Test Payment',
        ]);

        $response->assertStatus(400)
                 ->assertJson(['message' => 'Insufficient club balance. Please top up your wallet.']);

        $this->assertEquals(100, $user->fresh()->wallet_balance);
    }
}
