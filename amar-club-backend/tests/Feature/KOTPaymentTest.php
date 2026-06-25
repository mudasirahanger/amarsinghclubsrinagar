<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Order;
use App\Models\Transaction;

class KOTPaymentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Clear caches to prevent interference
        \Illuminate\Support\Facades\Cache::flush();
    }

    public function test_user_can_pay_their_own_pending_kot_order()
    {
        $user = User::factory()->create([
            'wallet_balance' => 2000
        ]);

        $order = Order::create([
            'user_id' => $user->id,
            'staff_id' => $user->id, // mock staff
            'total_amount' => 500,
            'status' => 'pending_payment'
        ]);

        $response = $this->actingAs($user)->postJson("/api/member/orders/{$order->id}/approve");

        $response->assertStatus(200)
                 ->assertJsonPath('message', 'Order payment successful!');

        $this->assertEquals(1500, $user->fresh()->wallet_balance);
        $this->assertEquals('completed', $order->fresh()->status);
        
        $this->assertDatabaseHas('transactions', [
            'user_id' => $user->id,
            'reference_id' => 'ORD-' . $order->id,
            'amount' => 500,
            'status' => 'completed'
        ]);
    }

    public function test_user_cannot_pay_already_paid_order()
    {
        $user = User::factory()->create([
            'wallet_balance' => 2000
        ]);

        $order = Order::create([
            'user_id' => $user->id,
            'staff_id' => $user->id,
            'total_amount' => 500,
            'status' => 'completed'
        ]);

        $response = $this->actingAs($user)->postJson("/api/member/orders/{$order->id}/approve");

        $response->assertStatus(400)
                 ->assertJsonPath('message', 'Payment failed.')
                 ->assertJsonPath('error', 'Order is not in pending state or already paid.');
                 
        $this->assertEquals(2000, $user->fresh()->wallet_balance);
    }

    public function test_user_cannot_pay_with_insufficient_balance()
    {
        $user = User::factory()->create([
            'wallet_balance' => 100 // Less than order
        ]);

        $order = Order::create([
            'user_id' => $user->id,
            'staff_id' => $user->id,
            'total_amount' => 500,
            'status' => 'pending_payment'
        ]);

        $response = $this->actingAs($user)->postJson("/api/member/orders/{$order->id}/approve");

        $response->assertStatus(400)
                 ->assertJsonPath('message', 'Payment failed.')
                 ->assertJsonPath('error', 'Insufficient club balance to pay for this order.');
                 
        $this->assertEquals(100, $user->fresh()->wallet_balance);
        $this->assertEquals('pending_payment', $order->fresh()->status);
    }

    public function test_user_cannot_pay_another_users_order()
    {
        $user1 = User::factory()->create(['wallet_balance' => 2000]);
        $user2 = User::factory()->create(['wallet_balance' => 2000]);

        $order = Order::create([
            'user_id' => $user2->id, // Belongs to user2
            'staff_id' => $user1->id,
            'total_amount' => 500,
            'status' => 'pending_payment'
        ]);

        // user1 tries to pay it
        $response = $this->actingAs($user1)->postJson("/api/member/orders/{$order->id}/approve");

        $response->assertStatus(400)
                 ->assertJsonPath('message', 'Payment failed.')
                 ->assertJsonPath('error', 'No query results for model [App\Models\Order].');
                 
        $this->assertEquals('pending_payment', $order->fresh()->status);
        $this->assertEquals(2000, $user1->fresh()->wallet_balance);
    }
}
