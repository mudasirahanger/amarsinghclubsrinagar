<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class MemberSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info("Seeding 808 members...");

        for ($i = 1; $i <= 808; $i++) {
            // Pad the number with leading zeros to make it 4 digits, e.g., 0001, 0039, 0808
            $memberId = str_pad($i, 4, '0', STR_PAD_LEFT);

            User::updateOrCreate(
                ['member_id' => $memberId], 
                [
                    'name' => 'Member ' . $memberId,
                    'email' => null, // Or generate a fake one if needed: "member{$memberId}@example.com"
                    'password' => Hash::make('1234'), // Default password '1234'
                    'wallet_balance' => 0,
                    'status' => 'active',
                    'is_staff' => false,
                ]
            );
        }

        $this->command->info("All 808 members seeded successfully!");
    }
}
