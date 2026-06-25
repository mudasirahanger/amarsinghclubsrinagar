<?php

namespace App\Filament\Imports;

use App\Models\MenuItem;
use Filament\Actions\Imports\ImportColumn;
use Filament\Actions\Imports\Importer;
use Filament\Actions\Imports\Models\Import;
use Illuminate\Support\Number;

class MenuItemImporter extends Importer
{
    protected static ?string $model = MenuItem::class;

    public static function getColumns(): array
    {
        return [
            ImportColumn::make('name')
                ->requiredMapping()
                ->rules(['required']),
            ImportColumn::make('price')
                ->requiredMapping()
                ->numeric()
                ->rules(['required', 'numeric']),
            ImportColumn::make('category')
                ->relationship(resolveUsing: 'name')
                ->rules(['required']),
            ImportColumn::make('tax_gst')
                ->numeric()
                ->rules(['numeric']),
            ImportColumn::make('discount')
                ->numeric()
                ->rules(['numeric']),
            ImportColumn::make('is_available')
                ->boolean()
                ->rules(['boolean']),
        ];
    }

    public function resolveRecord(): MenuItem
    {
        return MenuItem::firstOrNew([
            'name' => $this->data['name'] ?? null,
        ]);
    }

    public static function getCompletedNotificationBody(Import $import): string
    {
        $body = 'Your menu item import has completed and ' . Number::format($import->successful_rows) . ' ' . str('row')->plural($import->successful_rows) . ' imported.';

        if ($failedRowsCount = $import->getFailedRowsCount()) {
            $body .= ' ' . Number::format($failedRowsCount) . ' ' . str('row')->plural($failedRowsCount) . ' failed to import.';
        }

        return $body;
    }
}
