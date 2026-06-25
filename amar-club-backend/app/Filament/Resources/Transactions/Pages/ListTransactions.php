<?php

namespace App\Filament\Resources\Transactions\Pages;

use App\Filament\Resources\Transactions\TransactionResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListTransactions extends ListRecords
{
    protected static string $resource = TransactionResource::class;

    protected function getHeaderActions(): array
    {
        return [
            \pxlrbt\FilamentExcel\Actions\Pages\ExportAction::make('export_marg')
                ->label('Export for Marg ERP')
                ->icon('heroicon-o-document-arrow-down')
                ->color('success')
                ->exports([
                    \pxlrbt\FilamentExcel\Exports\ExcelExport::make('marg_export')
                        ->fromTable()
                        ->withFilename('Marg_Transactions_' . date('Y-m-d'))
                        ->withColumns([
                            \pxlrbt\FilamentExcel\Columns\Column::make('created_at')->heading('Voucher Date')->format('Y-m-d'),
                            \pxlrbt\FilamentExcel\Columns\Column::make('transaction_id')->heading('Voucher Number'),
                            \pxlrbt\FilamentExcel\Columns\Column::make('user.name')->heading('Ledger Name'),
                            \pxlrbt\FilamentExcel\Columns\Column::make('type')->heading('Voucher Type'),
                            \pxlrbt\FilamentExcel\Columns\Column::make('amount')->heading('Amount'),
                            \pxlrbt\FilamentExcel\Columns\Column::make('description')->heading('Narration'),
                        ])
                ]),
            CreateAction::make(),
        ];
    }
}
