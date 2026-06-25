<?php

namespace App\Filament\Pages;

use Filament\Pages\Page;
use Filament\Actions\ExportAction;
use Filament\Actions\Action;
use App\Filament\Exports\Gstr1Exporter;

class Accounting extends Page
{
    use \BezhanSalleh\FilamentShield\Traits\HasPageShield;

    protected string $view = 'filament.pages.accounting';
    
    public static function getNavigationIcon(): string | \BackedEnum | null
    {
        return 'heroicon-o-calculator';
    }

    public static function getNavigationGroup(): ?string
    {
        return 'Accounting';
    }

    public function exportGstr1Action(): Action
    {
        return ExportAction::make('exportGstr1')
            ->label('Download GSTR1 Report')
            ->icon('heroicon-o-document-arrow-down')
            ->color('primary')
            ->exporter(Gstr1Exporter::class);
    }

    public function exportMargAction(): Action
    {
        return \pxlrbt\FilamentExcel\Actions\Pages\ExportAction::make('exportMarg')
            ->label('Download Marg ERP Export')
            ->icon('heroicon-o-document-arrow-down')
            ->color('success')
            ->exports([
                \pxlrbt\FilamentExcel\Exports\ExcelExport::make('marg_export')
                    ->fromModel(\App\Models\Transaction::class)
                    ->withFilename('Marg_Transactions_' . date('Y-m-d'))
                    ->withColumns([
                        \pxlrbt\FilamentExcel\Columns\Column::make('created_at')->heading('Voucher Date')->format('Y-m-d'),
                        \pxlrbt\FilamentExcel\Columns\Column::make('transaction_id')->heading('Voucher Number'),
                        \pxlrbt\FilamentExcel\Columns\Column::make('user.name')->heading('Ledger Name'),
                        \pxlrbt\FilamentExcel\Columns\Column::make('type')->heading('Voucher Type'),
                        \pxlrbt\FilamentExcel\Columns\Column::make('amount')->heading('Amount'),
                        \pxlrbt\FilamentExcel\Columns\Column::make('description')->heading('Narration'),
                    ])
            ]);
    }
}
