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
        return ExportAction::make('exportMarg')
            ->label('Download Marg ERP Export')
            ->icon('heroicon-o-document-arrow-down')
            ->color('success')
            ->exporter(\App\Filament\Exports\MargExporter::class);
    }
}
