<?php

namespace App\Filament\Resources\Orders\Schemas;

use Filament\Forms\Components\Hidden;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Placeholder;
use Filament\Schemas\Schema;

class OrderForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('user_id')
                    ->label('Member')
                    ->relationship('user', 'name')
                    ->getOptionLabelFromRecordUsing(fn ($record) => "{$record->name} (ID: {$record->member_id})")
                    ->searchable(['name', 'member_id'])
                    ->disabledOn('edit')
                    ->required(),
                
                Hidden::make('staff_id')
                    ->default(fn () => auth()->id() ?? 1),
                
                Select::make('status')
                    ->options([
                        'draft' => 'Draft',
                        'pending_payment' => 'Pending Payment',
                        'completed' => 'Completed',
                        'cancelled' => 'Cancelled',
                    ])
                    ->default('pending_payment')
                    ->required(),
                
                Repeater::make('orderItems')
                    ->relationship()
                    ->schema([
                        Select::make('menu_item_id')
                            ->relationship('menuItem', 'name')
                            ->getOptionLabelFromRecordUsing(fn ($record) => "{$record->name} (₹{$record->price})")
                            ->searchable(['name'])
                            ->preload()
                            ->createOptionForm([
                                \Filament\Forms\Components\TextInput::make('name')
                                    ->required()
                                    ->maxLength(255),
                                \Filament\Forms\Components\Select::make('category_id')
                                    ->relationship('category', 'name')
                                    ->searchable()
                                    ->preload()
                                    ->required(),
                                \Filament\Forms\Components\TextInput::make('price')
                                    ->numeric()
                                    ->required()
                                    ->prefix('₹'),
                                \Filament\Forms\Components\TextInput::make('tax_gst')
                                    ->label('GST %')
                                    ->numeric()
                                    ->default(0),
                            ])
                            ->required()
                            ->disableOptionsWhenSelectedInSiblingRepeaterItems()
                            ->live(onBlur: true)
                            ->afterStateUpdated(function ($state, callable $set, callable $get) {
                                $menuItem = \App\Models\MenuItem::find($state);
                                if ($menuItem) {
                                    $set('unit_price', $menuItem->price);
                                    $set('tax_gst', $menuItem->tax_gst);
                                }
                                self::updateTotalFromItem($get, $set);
                            }),
                        
                        TextInput::make('quantity')
                            ->numeric()
                            ->default(1)
                            ->required()
                            ->live(onBlur: true)
                            ->afterStateUpdated(function (callable $get, callable $set) {
                                self::updateTotalFromItem($get, $set);
                            }),
                        
                        TextInput::make('tax_gst')
                            ->label('Tax (GST %)')
                            ->numeric()
                            ->readOnly()
                            ->dehydrated(),
                        
                        TextInput::make('unit_price')
                            ->numeric()
                            ->readOnly()
                            ->required(),
                    ])
                    ->columns(4)
                    ->live(onBlur: true)
                    ->afterStateUpdated(function (callable $get, callable $set) {
                        self::updateTotal($get, $set);
                    })
                    ->deleteAction(
                        fn ($action) => $action->after(fn (callable $get, callable $set) => self::updateTotal($get, $set)),
                    )
                    ->addActionLabel('Add Order Item')
                    ->addAction(
                        fn ($action) => $action->icon('heroicon-m-plus-circle')->color('primary')
                    )
                    ->columnSpanFull(),
                
                \Filament\Schemas\Components\Grid::make(2)->schema([
                    \Filament\Schemas\Components\Group::make([
                        TextInput::make('total_tax')
                            ->label('Total Tax (GST)')
                            ->numeric()
                            ->disabled()
                            ->dehydrated()
                            ->default(0),

                        TextInput::make('total_amount')
                            ->numeric()
                            ->disabled()
                            ->dehydrated()
                            ->default(0)
                            ->required(),
                    ])->columnSpan(1),
                ]),
            ]);
    }

    public static function updateTotal(callable $get, callable $set): void
    {
        $items = $get('orderItems');
        $subtotal = 0;
        $totalTax = 0;
        if (is_array($items)) {
            foreach ($items as $item) {
                $qty = $item['quantity'] ?? 0;
                $price = $item['unit_price'] ?? 0;
                $gstRate = $item['tax_gst'] ?? 0;
                
                $itemTotal = $qty * $price;
                $itemTax = $itemTotal * ($gstRate / 100);
                
                $subtotal += $itemTotal;
                $totalTax += $itemTax;
            }
        }
        $set('total_tax', round($totalTax, 2));
        $set('total_amount', round($subtotal + $totalTax, 2));
    }

    public static function updateTotalFromItem(callable $get, callable $set): void
    {
        $items = $get('../../orderItems');
        $subtotal = 0;
        $totalTax = 0;
        if (is_array($items)) {
            foreach ($items as $item) {
                $qty = $item['quantity'] ?? 0;
                $price = $item['unit_price'] ?? 0;
                $gstRate = $item['tax_gst'] ?? 0;
                
                $itemTotal = $qty * $price;
                $itemTax = $itemTotal * ($gstRate / 100);
                
                $subtotal += $itemTotal;
                $totalTax += $itemTax;
            }
        }
        $set('../../total_tax', round($totalTax, 2));
        $set('../../total_amount', round($subtotal + $totalTax, 2));
    }
}
