<?php

namespace App\Filament\Widgets;

use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class StatsOverview extends StatsOverviewWidget
{
    protected static ?int $sort = 1;

    protected function getStats(): array
    {
        $totalSales = \App\Models\Transaction::where('type', 'credit')
            ->where('status', 'completed')
            ->sum('amount');

        $pendingTopups = \App\Models\Transaction::where('type', 'credit')
            ->where('status', 'pending')
            ->where('payment_method', 'cash')
            ->count();

        $totalMembers = \App\Models\User::where('status', 'active')->count();

        return [
            Stat::make('Total Sales (All Time)', '₹' . number_format($totalSales, 2))
                ->description('Total completed top-ups')
                ->descriptionIcon('heroicon-m-arrow-trending-up')
                ->color('success'),
            Stat::make('Pending Cash Requests', $pendingTopups)
                ->description('Requires cashier approval')
                ->descriptionIcon('heroicon-m-clock')
                ->color($pendingTopups > 0 ? 'warning' : 'gray'),
            Stat::make('Active Members', $totalMembers)
                ->description('Total registered active members')
                ->descriptionIcon('heroicon-m-users')
                ->color('primary'),
        ];
    }
}
