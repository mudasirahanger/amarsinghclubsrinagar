<?php

namespace App\Filament\Resources\Activities;

use App\Filament\Resources\Activities\Pages\ManageActivities;
use Spatie\Activitylog\Models\Activity;
use BackedEnum;
use Filament\Actions\BulkActionGroup;
use Filament\Resources\Resource;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Actions\ViewAction;

class ActivityResource extends Resource
{
    protected static ?string $model = Activity::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-clipboard-document-list';
    
    protected static string|\UnitEnum|null $navigationGroup = 'System';
    
    protected static ?string $navigationLabel = 'Audit Logs';

    protected static ?string $pluralModelLabel = 'Audit Logs';

    public static function canCreate(): bool
    {
        return false;
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('created_at')
                    ->label('Date & Time')
                    ->dateTime('d M Y, h:i A')
                    ->sortable()
                    ->searchable(),
                
                TextColumn::make('causer.name')
                    ->label('Member/User')
                    ->sortable()
                    ->searchable()
                    ->placeholder('System'),

                TextColumn::make('event')
                    ->label('Event Type')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'login' => 'success',
                        'top_up' => 'info',
                        default => 'gray',
                    }),
                    
                TextColumn::make('description')
                    ->label('Description')
                    ->searchable(),
                    
                TextColumn::make('properties.amount')
                    ->label('Amount')
                    ->money('inr')
                    ->sortable()
                    ->placeholder('-'),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                SelectFilter::make('event')
                    ->label('Filter by Event')
                    ->options([
                        'login' => 'Member Logged In',
                        'top_up' => 'Member Added Money',
                    ]),
            ])
            ->recordActions([
                // 
            ])
            ->bulkActions([
                \Filament\Actions\BulkActionGroup::make([
                    \pxlrbt\FilamentExcel\Actions\ExportBulkAction::make(),
                ]),
            ])
            ->toolbarActions([
                //
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ManageActivities::route('/'),
        ];
    }
}
