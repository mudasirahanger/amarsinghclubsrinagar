<?php

namespace App\Filament\Imports;

use App\Models\User;
use Filament\Actions\Imports\ImportColumn;
use Filament\Actions\Imports\Importer;
use Filament\Actions\Imports\Models\Import;
use Illuminate\Support\Number;

class UserImporter extends Importer
{
    protected static ?string $model = User::class;

    public static function getColumns(): array
    {
        return [
            ImportColumn::make('name')
                ->requiredMapping()
                ->rules(['required']),
            ImportColumn::make('email')
                ->rules(['email']),
            ImportColumn::make('phone'),
            ImportColumn::make('member_id')
                ->requiredMapping()
                ->rules(['required']),
            ImportColumn::make('wallet_balance')
                ->numeric()
                ->rules(['integer']),
            ImportColumn::make('member_tier'),
            ImportColumn::make('status'),
        ];
    }

    public function resolveRecord(): User
    {
        return User::firstOrNew(
            ['email' => $this->data['email'] ?? null],
            [
                'password' => \Hash::make('AmarSinghClub@123'),
                'is_staff' => false,
            ]
        );
    }

    public static function getCompletedNotificationBody(Import $import): string
    {
        $body = 'Your user import has completed and ' . Number::format($import->successful_rows) . ' ' . str('row')->plural($import->successful_rows) . ' imported.';

        if ($failedRowsCount = $import->getFailedRowsCount()) {
            $body .= ' ' . Number::format($failedRowsCount) . ' ' . str('row')->plural($failedRowsCount) . ' failed to import.';
        }

        return $body;
    }
}
