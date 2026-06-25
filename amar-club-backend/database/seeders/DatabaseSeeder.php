<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(RoleSeeder::class);

        // Seed Admin User
        $admin = User::updateOrCreate(
            ['member_id' => 'ADMIN'],
            [
                'name' => 'Admin User',
                'email' => 'secretary@amarsinghclubsrinagar.com',
                'password' => bcrypt('abcd1234'),
                'is_staff' => true,
            ]
        );
        $admin->assignRole('super_admin');

        // Seed Test Member
        User::updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Tester',
                'password' => bcrypt('1234'),
                'member_id' => 'TEST_01',
                'wallet_balance' => 850,
                'status' => 'active',
            ]
        );
    }
}
