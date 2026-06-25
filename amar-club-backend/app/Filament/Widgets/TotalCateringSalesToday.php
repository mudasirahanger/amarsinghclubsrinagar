<?php

namespace App\Filament\Widgets;

use App\Models\Order;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Carbon;

class TotalCateringSalesToday extends BaseWidget
{
    protected static ?int $sort = 1;

    protected function getStats(): array
    {
        $total = Order::where('status', 'completed')
            ->whereDate('created_at', Carbon::today())
            ->sum('total_amount');

        return [
            Stat::make('Total Catering Sales Today', '₹' . number_format($total, 2))
                ->description('Completed orders only')
                ->descriptionIcon('heroicon-m-currency-rupee')
                ->color('success'),
        ];
    }
}
