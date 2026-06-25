<?php

namespace App\Filament\Resources\Orders;

use App\Filament\Resources\Orders\Pages\CreateOrder;
use App\Filament\Resources\Orders\Pages\EditOrder;
use App\Filament\Resources\Orders\Pages\ListOrders;
use App\Filament\Resources\Orders\Schemas\OrderForm;
use App\Filament\Resources\Orders\Tables\OrdersTable;
use App\Models\Order;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class OrderResource extends Resource
{
    protected static ?string $model = Order::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-shopping-cart';

    protected static ?string $modelLabel = 'Order (KOT)';

    protected static ?string $pluralModelLabel = 'Orders (KOT)';

    protected static ?string $navigationLabel = 'Orders (KOT)';

    public static function form(Schema $schema): Schema
    {
        return OrderForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return OrdersTable::configure($table);
    }

    public static function canCreate(): bool
    {
        return true;
    }

    public static function getRelations(): array
    {
        return [
            \App\Filament\Resources\Orders\RelationManagers\OrderItemsRelationManager::class,
            \App\Filament\Resources\Orders\RelationManagers\OrderHistoriesRelationManager::class,
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListOrders::route('/'),
            'create' => \App\Filament\Resources\Orders\Pages\CreateOrder::route('/create'),
            'view' => \App\Filament\Resources\Orders\Pages\ViewOrder::route('/{record}'),
            'edit' => \App\Filament\Resources\Orders\Pages\EditOrder::route('/{record}/edit'),
        ];
    }
}
