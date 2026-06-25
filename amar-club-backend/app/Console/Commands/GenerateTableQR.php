<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class GenerateTableQR extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'club:generate-qr {table : The table number or identifier}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generates a signed payload for a club table QR code';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $tableName = $this->argument('table');
        
        $payload = [
            'type' => 'table_payment',
            'table' => $tableName,
            'timestamp' => now()->timestamp,
        ];
        
        $dataToSign = json_encode($payload);
        // Generate HMAC signature using the APP_KEY
        $signature = hash_hmac('sha256', $dataToSign, config('app.key'));
        
        $finalPayload = [
            'prefix' => 'AMARSINGHCLUB',
            'data' => $payload,
            'signature' => $signature
        ];
        
        $qrString = json_encode($finalPayload);
        
        $this->info("QR Code Payload for {$tableName}:");
        $this->line($qrString);
        $this->info("Use this exact string to generate the QR code image.");
    }
}
