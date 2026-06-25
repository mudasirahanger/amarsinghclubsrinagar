<?php

namespace App\Filament\Widgets;

use App\Models\Order;
use App\Models\User;
use App\Models\MenuItem;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class DashboardStatsWidget extends BaseWidget
{
    protected static ?int $sort = 1;

    protected function getStats(): array
    {
        return [
            Stat::make('Total Orders', Order::count())
                ->description('All recorded orders')
                ->descriptionIcon('heroicon-m-shopping-cart')
                ->color('primary'),
            
            Stat::make('Total Members', User::count())
                ->description('Registered club members')
                ->descriptionIcon('heroicon-m-users')
                ->color('info'),
            
            Stat::make('Total Sales', '₹' . number_format(Order::where('status', 'completed')->sum('total_amount'), 2))
                ->description('Revenue from completed orders')
                ->descriptionIcon('heroicon-m-currency-rupee')
                ->color('success'),
            
            Stat::make('Total Inventory', MenuItem::count())
                ->description('Menu items available')
                ->descriptionIcon('heroicon-m-clipboard-document-list')
                ->color('warning'),
            
            Stat::make('Out of Stock', MenuItem::where('is_available', false)->count())
                ->description('Unavailable menu items')
                ->descriptionIcon('heroicon-m-exclamation-triangle')
                ->color('danger'),

            Stat::make('Transactions Breakdown', \App\Models\Transaction::whereIn('payment_method', ['cash', 'razorpay'])->count())
                ->description('Cash: ' . \App\Models\Transaction::where('payment_method', 'cash')->count() . ' | Online: ' . \App\Models\Transaction::where('payment_method', 'razorpay')->count())
                ->descriptionIcon('heroicon-m-banknotes')
                ->color('success'),
        ];
    }
}
