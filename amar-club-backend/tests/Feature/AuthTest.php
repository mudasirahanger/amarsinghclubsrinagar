<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_with_correct_credentials()
    {
        $user = User::factory()->create([
            'member_id' => 'ASC-1234',
            'password' => bcrypt('1234'), // The "secret code"
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/login', [
            'member_id' => 'ASC-1234',
            'password' => '1234',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure(['user', 'token']);
    }

    public function test_user_cannot_login_with_incorrect_credentials()
    {
        $user = User::factory()->create([
            'member_id' => 'ASC-1234',
            'password' => bcrypt('1234'),
        ]);

        $response = $this->postJson('/api/login', [
            'member_id' => 'ASC-1234',
            'password' => '9999',
        ]);

        $response->assertStatus(401)
                 ->assertJson(['message' => 'Invalid Member ID or Secret Code.']);
    }

    public function test_inactive_user_cannot_login()
    {
        $user = User::factory()->create([
            'member_id' => 'ASC-1234',
            'password' => bcrypt('1234'),
            'status' => 'inactive',
        ]);

        $response = $this->postJson('/api/login', [
            'member_id' => 'ASC-1234',
            'password' => '1234',
        ]);

        $response->assertStatus(403)
                 ->assertJson(['message' => 'This membership is currently suspended.']);
    }
}
