<?php

namespace App\Filament\Widgets;

use Filament\Widgets\ChartWidget;

class RevenueChart extends ChartWidget
{
    protected static ?int $sort = 3;
    protected ?string $heading = 'Revenue (Last 7 Days)';
    
    protected int | string | array $columnSpan = 'full';

    protected function getData(): array
    {
        $data = \Flowframe\Trend\Trend::query(
            \App\Models\Transaction::where('type', 'credit')->where('status', 'completed')
        )
        ->between(
            start: now()->subDays(6),
            end: now(),
        )
        ->perDay()
        ->sum('amount');

        return [
            'datasets' => [
                [
                    'label' => 'Revenue (₹)',
                    'data' => $data->map(fn (\Flowframe\Trend\TrendValue $value) => $value->aggregate),
                    'borderColor' => '#10b981', // Tailwind success color
                    'backgroundColor' => 'rgba(16, 185, 129, 0.2)',
                    'fill' => true,
                ],
            ],
            'labels' => $data->map(fn (\Flowframe\Trend\TrendValue $value) => \Carbon\Carbon::parse($value->date)->format('M d')),
        ];
    }

    protected function getType(): string
    {
        return 'line';
    }
}
