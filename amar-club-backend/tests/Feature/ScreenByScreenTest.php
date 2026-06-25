<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class ScreenByScreenTest extends TestCase
{
    use RefreshDatabase;
    public function test_user_flow()
    {
        echo "\n\n=== 📱 STARTING SCREEN-BY-SCREEN TEST ===\n";
        
        $tester = User::factory()->create([
            'name' => 'Tester',
            'email' => 'tester@example.com',
            'member_id' => '0039',
            'password' => Hash::make('1234'),
            'wallet_balance' => 850,
            'status' => 'active'
        ]);

        // 1. Login Screen
        echo "1. [Login Screen] Logging in with member_id: 0039, password: 1234\n";
        $response = $this->postJson('/api/login', [
            'member_id' => '0039',
            'password' => '1234',
        ]);
        $response->assertStatus(200);
        $token = $response->json('token');
        $user = $response->json('user');
        echo "   ✅ Login successful. Token received. Welcome, " . $user['name'] . "!\n\n";

        // 2. Home Screen
        echo "2. [Home Screen] Fetching user profile and wallet balance\n";
        $response = $this->withHeader('Authorization', 'Bearer ' . $token)->getJson('/api/user');
        $response->assertStatus(200);
        $balance = $response->json('wallet_balance');
        echo "   ✅ Profile fetched. Current Balance: ₹" . $balance . "\n\n";

        // 3. Top-Up Screen
        echo "3. [Top-Up Screen] Requesting Cash Top-up of ₹500\n";
        $response = $this->withHeader('Authorization', 'Bearer ' . $token)->postJson('/api/wallet/top-up', [
            'amount' => 500,
            'payment_method' => 'cash'
        ]);
        $response->assertStatus(200);
        echo "   ✅ Top-up request submitted. Status: Pending Admin Approval.\n\n";

        // 4. Scanner/Pay Screen
        echo "4. [Scanner Screen] Scanning QR and paying ₹150 for Table 5\n";
        
        $qrPayload = [
            'prefix' => 'AMARSINGHCLUB',
            'data' => ['type' => 'table_payment', 'table' => 'Table 5'],
        ];
        // Sign the payload
        $dataToSign = json_encode($qrPayload['data']);
        $qrPayload['signature'] = hash_hmac('sha256', $dataToSign, config('app.key'));

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)->postJson('/api/wallet/pay', [
            'amount' => 150,
            'description' => 'Payment for Table 5',
            'qr_payload' => $qrPayload
        ]);
        $response->assertStatus(200);
        $newBalance = $response->json('wallet_balance');
        echo "   ✅ Payment successful. New Balance: ₹" . $newBalance . "\n\n";

        // 5. Activity/History Screen
        echo "5. [Activity Screen] Fetching transaction history\n";
        $response = $this->withHeader('Authorization', 'Bearer ' . $token)->getJson('/api/wallet/history');
        $response->assertStatus(200);
        $transactions = $response->json();
        echo "   ✅ History fetched. " . count($transactions) . " recent transactions found.\n";
        foreach (array_slice($transactions, 0, 2) as $tx) {
            echo "      - " . $tx['type'] . " | ₹" . $tx['amount'] . " | " . $tx['status'] . "\n";
        }
        echo "\n=== 🏁 ALL SCREENS PASSED ===\n";
    }
}
