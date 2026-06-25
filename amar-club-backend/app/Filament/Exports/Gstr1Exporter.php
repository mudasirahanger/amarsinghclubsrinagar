<?php

namespace App\Filament\Exports;

use App\Models\Order;
use Filament\Actions\Exports\ExportColumn;
use Filament\Actions\Exports\Exporter;
use Filament\Actions\Exports\Models\Export;
use Illuminate\Support\Number;

class Gstr1Exporter extends Exporter
{
    protected static ?string $model = Order::class;

    public static function getColumns(): array
    {
        return [
            ExportColumn::make('id')
                ->label('Invoice Number')
                ->state(fn (Order $record) => 'ORD-' . $record->id),
            ExportColumn::make('created_at')
                ->label('Invoice Date')
                ->state(fn (Order $record) => $record->created_at->format('Y-m-d')),
            ExportColumn::make('user.name')
                ->label('Customer/Member Name'),
            ExportColumn::make('taxable_value')
                ->label('Taxable Value (₹)')
                ->state(fn (Order $record) => number_format($record->total_amount - $record->total_tax, 2, '.', '')),
            ExportColumn::make('total_tax')
                ->label('Total Tax GST (₹)')
                ->state(fn (Order $record) => number_format($record->total_tax, 2, '.', '')),
            ExportColumn::make('total_amount')
                ->label('Invoice Value (₹)')
                ->state(fn (Order $record) => number_format($record->total_amount, 2, '.', '')),
            ExportColumn::make('status')
                ->label('Status'),
        ];
    }

    public static function getCompletedNotificationBody(Export $export): string
    {
        $body = 'Your GSTR1 sales export has completed and ' . Number::format($export->successful_rows) . ' ' . str('row')->plural($export->successful_rows) . ' exported.';

        if ($failedRowsCount = $export->getFailedRowsCount()) {
            $body .= ' ' . Number::format($failedRowsCount) . ' ' . str('row')->plural($failedRowsCount) . ' failed to export.';
        }

        return $body;
    }
}
