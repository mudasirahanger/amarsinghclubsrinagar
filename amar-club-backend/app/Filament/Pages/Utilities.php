<?php

namespace App\Filament\Pages;

use Filament\Pages\Page;
use Filament\Actions\ExportAction;
use Filament\Actions\Action;
use Filament\Forms\Components\FileUpload;
use Filament\Notifications\Notification;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\MembersImport;
use App\Imports\MenuItemsImport;
use App\Imports\CategoriesImport;
use App\Filament\Exports\UserExporter;
use App\Filament\Exports\MenuItemExporter;
use App\Filament\Exports\CategoryExporter;

class Utilities extends Page
{
    use \BezhanSalleh\FilamentShield\Traits\HasPageShield;

    protected string $view = 'filament.pages.utilities';
    
    public static function getNavigationIcon(): string | \BackedEnum | null
    {
        return 'heroicon-o-wrench-screwdriver';
    }

    public static function getNavigationGroup(): ?string
    {
        return 'Utilities';
    }

    public function importMembersAction(): Action
    {
        return Action::make('importMembers')
            ->label('Import Members')
            ->icon('heroicon-o-arrow-down-tray')
            ->color('primary')
            ->form([
                FileUpload::make('file')
                    ->label('Excel or CSV File')
                    ->disk('local')
                    ->acceptedFileTypes(['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
                    ->required(),
            ])
            ->action(function (array $data) {
                Excel::import(new MembersImport, \Illuminate\Support\Facades\Storage::disk('local')->path($data['file']));
                Notification::make()->title('Members imported successfully!')->success()->send();
            })
            ->extraModalFooterActions(fn (Action $action): array => [
                Action::make('downloadSample')
                    ->label('Download Sample CSV')
                    ->url(route('download.sample', ['type' => 'members']))
                    ->color('gray'),
            ]);
    }

    public function exportMembersAction(): Action
    {
        return ExportAction::make('exportMembers')
            ->label('Export Members')
            ->icon('heroicon-o-arrow-up-tray')
            ->color('gray')
            ->exporter(UserExporter::class);
    }

    public function importItemsAction(): Action
    {
        return Action::make('importItems')
            ->label('Import Menu Items')
            ->icon('heroicon-o-arrow-down-tray')
            ->color('primary')
            ->form([
                FileUpload::make('file')
                    ->label('Excel or CSV File')
                    ->disk('local')
                    ->acceptedFileTypes(['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
                    ->required(),
            ])
            ->action(function (array $data) {
                Excel::import(new MenuItemsImport, \Illuminate\Support\Facades\Storage::disk('local')->path($data['file']));
                Notification::make()->title('Menu Items imported successfully!')->success()->send();
            })
            ->extraModalFooterActions(fn (Action $action): array => [
                Action::make('downloadSample')
                    ->label('Download Sample CSV')
                    ->url(route('download.sample', ['type' => 'menu_items']))
                    ->color('gray'),
            ]);
    }

    public function exportItemsAction(): Action
    {
        return ExportAction::make('exportItems')
            ->label('Export Menu Items')
            ->icon('heroicon-o-arrow-up-tray')
            ->color('gray')
            ->exporter(MenuItemExporter::class);
    }

    public function importCategoriesAction(): Action
    {
        return Action::make('importCategories')
            ->label('Import Categories')
            ->icon('heroicon-o-arrow-down-tray')
            ->color('primary')
            ->form([
                FileUpload::make('file')
                    ->label('Excel or CSV File')
                    ->disk('local')
                    ->acceptedFileTypes(['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
                    ->required(),
            ])
            ->action(function (array $data) {
                Excel::import(new CategoriesImport, \Illuminate\Support\Facades\Storage::disk('local')->path($data['file']));
                Notification::make()->title('Categories imported successfully!')->success()->send();
            })
            ->extraModalFooterActions(fn (Action $action): array => [
                Action::make('downloadSample')
                    ->label('Download Sample CSV')
                    ->url(route('download.sample', ['type' => 'categories']))
                    ->color('gray'),
            ]);
    }

    public function exportCategoriesAction(): Action
    {
        return ExportAction::make('exportCategories')
            ->label('Export Categories')
            ->icon('heroicon-o-arrow-up-tray')
            ->color('gray')
            ->exporter(CategoryExporter::class);
    }
}
