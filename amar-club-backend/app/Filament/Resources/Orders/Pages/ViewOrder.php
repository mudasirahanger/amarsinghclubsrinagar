<?php

namespace App\Filament\Resources\Orders\Pages;

use App\Filament\Resources\Orders\OrderResource;
use Filament\Resources\Pages\ViewRecord;

class ViewOrder extends ViewRecord
{
    protected static string $resource = OrderResource::class;

    protected function getHeaderActions(): array
    {
        return [
            \Filament\Actions\EditAction::make(),
            \Filament\Actions\Action::make('print')
                ->label('Print KOT')
                ->icon('heroicon-o-printer')
                ->url(fn (\App\Models\Order $record) => route('invoice.print', $record))
                ->openUrlInNewTab(),
        ];
    }
}
