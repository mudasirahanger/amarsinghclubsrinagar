<?php

namespace App\Filament\Widgets;

use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class UserStatsWidget extends StatsOverviewWidget
{
    protected function getStats(): array
    {
        $onlineUsers = \App\Models\User::where('last_seen_at', '>=', now()->subMinutes(5))->count();
        $iosUsers = \App\Models\User::where('device_os', 'ios')->count();
        $androidUsers = \App\Models\User::where('device_os', 'android')->count();

        return [
            Stat::make('Online Active Users (Last 5 mins)', $onlineUsers)
                ->description('Users currently using the app')
                ->descriptionIcon('heroicon-m-signal')
                ->color('success'),
            Stat::make('iOS App Users', $iosUsers)
                ->description('Total users on iPhone/iPad')
                ->descriptionIcon('heroicon-m-device-phone-mobile')
                ->color('info'),
            Stat::make('Android App Users', $androidUsers)
                ->description('Total users on Android')
                ->descriptionIcon('heroicon-m-device-phone-mobile')
                ->color('success'),
        ];
    }
}
