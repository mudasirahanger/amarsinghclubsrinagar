<?php

namespace App\Filament\Resources\Orders\RelationManagers;

use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class OrderItemsRelationManager extends RelationManager
{
    protected static string $relationship = 'orderItems';

    public function form(Schema $schema): Schema
    {
        return $schema->components([]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('menuItem.name')
            ->columns([
                TextColumn::make('menuItem.name')
                    ->searchable(),
                TextColumn::make('quantity')
                    ->numeric(),
                TextColumn::make('unit_price')
                    ->money('INR'),
                TextColumn::make('subtotal')
                    ->getStateUsing(fn ($record) => $record->quantity * $record->unit_price)
                    ->money('INR'),
            ])
            ->filters([
                //
            ])
            ->headerActions([
                //
            ])
            ->recordActions([
                //
            ])
            ->toolbarActions([
                //
            ]);
    }
    
    protected function canCreate(): bool { return false; }
    protected function canEdit(\Illuminate\Database\Eloquent\Model $record): bool { return false; }
    protected function canDelete(\Illuminate\Database\Eloquent\Model $record): bool { return false; }
}
