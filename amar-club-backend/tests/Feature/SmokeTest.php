<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;

class SmokeTest extends TestCase
{
    use RefreshDatabase;

    public function test_system_status_api()
    {
        $response = $this->getJson('/api/system/status');
        $response->assertStatus(200);
        $response->assertJsonStructure(['maintenance_mode', 'minimum_app_version', 'app_store_url', 'play_store_url']);
    }

    public function test_pos_menu_api()
    {
        $user = User::factory()->create();
        $response = $this->actingAs($user)->getJson('/api/pos/menu');
        $response->assertStatus(200);
    }

    public function test_pos_search_members_api()
    {
        $user = User::factory()->create();
        User::factory()->create(['member_id' => '0039']);
        $response = $this->actingAs($user)->getJson('/api/pos/members/search?query=0039');
        $response->assertStatus(200);
    }

    public function test_authenticated_user_profile()
    {
        $user = User::factory()->create();
        $response = $this->actingAs($user)->getJson('/api/user');
        $response->assertStatus(200);
        $response->assertJsonStructure(['member_id', 'name']);
    }

    public function test_authenticated_notifications()
    {
        $user = User::factory()->create();
        $response = $this->actingAs($user)->getJson('/api/notifications');
        $response->assertStatus(200);
    }
}
