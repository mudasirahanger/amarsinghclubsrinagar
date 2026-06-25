<?php

namespace App\Imports;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class MembersImport implements ToModel, WithHeadingRow
{
    public function model(array $row)
    {
        return User::firstOrCreate(
            ['email' => $row['email']],
            [
                'name' => $row['name'] ?? 'Unknown',
                'phone' => $row['phone'] ?? null,
                'member_id' => $row['member_id'] ?? null,
                'wallet_balance' => $row['wallet_balance'] ?? 0,
                'member_tier' => $row['member_tier'] ?? 'Standard',
                'status' => $row['status'] ?? 'active',
                'password' => Hash::make('AmarSinghClub@123'),
                'is_staff' => false,
            ]
        );
    }
}
