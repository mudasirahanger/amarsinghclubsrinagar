<?php

namespace App\Filament\Resources\Orders\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class OrdersTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                \Filament\Tables\Columns\TextColumn::make('user.name')
                    ->label('Member Name')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('staff_id')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('total_amount')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('status')
                    ->searchable(),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                \Filament\Tables\Filters\TrashedFilter::make(),
            ])
            ->recordActions([
                \Filament\Actions\EditAction::make(),
                \Filament\Actions\ViewAction::make(),
                \Filament\Actions\Action::make('print')
                    ->label('Print KOT')
                    ->icon('heroicon-m-printer')
                    ->url(fn (\App\Models\Order $record) => route('invoice.print', $record))
                    ->openUrlInNewTab(),
                \Filament\Actions\Action::make('archive')
                    ->label('Delete')
                    ->icon('heroicon-m-trash')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->modalHeading('Archive Order')
                    ->modalDescription('Are you sure you want to delete this order? It will be archived.')
                    ->modalSubmitActionLabel('Yes, delete it')
                    ->action(function (\App\Models\Order $record) {
                        $record->update(['status' => 'archived']);
                        \App\Models\Transaction::where('reference_id', 'ORD-' . $record->id)->get()->each->delete();
                        if ($record->user) {
                            foreach ($record->user->notifications as $notification) {
                                if (isset($notification->data['order_id']) && $notification->data['order_id'] == $record->id) {
                                    $notification->delete();
                                }
                            }
                        }
                        \Filament\Notifications\Notification::make()->title('Order archived')->success()->send();
                    }),
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
}
