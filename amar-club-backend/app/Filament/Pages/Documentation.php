<?php

namespace App\Filament\Pages;

use Filament\Pages\Page;

class Documentation extends Page
{
    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-book-open';
    protected static string|\UnitEnum|null $navigationGroup = 'Resources';
    protected static ?int $navigationSort = 1;

    protected string $view = 'filament.pages.documentation';
}
