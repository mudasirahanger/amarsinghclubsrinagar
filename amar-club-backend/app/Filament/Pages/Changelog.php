<?php

namespace App\Filament\Pages;

use Filament\Pages\Page;

class Changelog extends Page
{
    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-clipboard-document-list';
    protected static string|\UnitEnum|null $navigationGroup = 'Resources';
    protected static ?int $navigationSort = 2;

    protected string $view = 'filament.pages.changelog';

    public static function canAccess(): bool
    {
        return true;
    }
}
