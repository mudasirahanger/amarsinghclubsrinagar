<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class ImportMembers extends Command
{
    // This is the command you will type in the terminal
    protected $signature = 'club:import-members {file_path}';
    protected $description = 'Import members from the provided CSV file';

    public function handle()
    {
        // Prevent the script from timing out for large files
        set_time_limit(0);

        $filePath = $this->argument('file_path');

        if (!file_exists($filePath)) {
            $this->error("File not found: {$filePath}");
            return;
        }

        $this->info("Reading CSV...");
        
        $file = fopen($filePath, 'r');
        $headers = fgetcsv($file); // Skip the header row

        $count = 0;
        
        // Hash the default "1234" secret code ONCE instead of on every single row.
        // This makes the import exponentially faster and prevents the 30-second timeout!
        $defaultPassword = Hash::make('1234');

        while (($row = fgetcsv($file)) !== FALSE) {
            // Map CSV columns to variables
            $name = $row[0];
            $mNo = $row[1];
            
            // Clean up mobile
            $mobile = preg_replace('/[^0-9]/', '', explode("\n", $row[2])[0] ?? '');
            
            // STRICTLY enforce true NULL for empty emails
            $rawEmail = $row[4] ?? '';
            $email = trim($rawEmail) === '' ? null : trim($rawEmail);

            // Format Member ID (e.g., M.NO 24 becomes ASC-0024)
            $formattedMemberId = 'ASC-' . str_pad($mNo, 4, '0', STR_PAD_LEFT);

            // Insert into Database
            User::updateOrCreate(
                ['member_id' => $formattedMemberId], // Check if exists
                [
                    'name' => trim($name),
                    'phone' => $mobile,
                    'email' => $email,
                    'password' => $defaultPassword, 
                    // Add a default wallet balance to test with
                    'wallet_balance' => 0.00,
                    'member_tier' => 'Standard'
                ]
            );

            $count++;
        }

        fclose($file);
        $this->info("Successfully imported {$count} members!");
    }
}