<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Notifications\WalletActivity;
use Illuminate\Http\Request;

class POSController extends Controller
{
    public function getMenu()
    {
        $items = MenuItem::where('is_available', true)->get()->groupBy('category');
        return response()->json($items);
    }

    public function searchMembers(Request $request)
    {
        $q = $request->query('q');
        if (!$q) {
            return response()->json([]);
        }

        $members = User::where('name', 'like', "%{$q}%")
            ->orWhere('member_id', 'like', "%{$q}%")
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'member_id' => $user->member_id,
                    'wallet_balance' => $user->wallet_balance,
                    'has_sufficient_balance' => $user->wallet_balance > 0,
                ];
            });

        return response()->json($members);
    }

    public function createOrder(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'items' => 'required|array|min:1',
            'items.*.menu_item_id' => 'required|exists:menu_items,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $user = User::findOrFail($request->user_id);
        $totalAmount = 0;
        $orderItemsData = [];

        foreach ($request->items as $item) {
            $menuItem = MenuItem::findOrFail($item['menu_item_id']);
            $quantity = $item['quantity'];
            $unitPrice = $menuItem->price;

            $totalAmount += $unitPrice * $quantity;

            $orderItemsData[] = [
                'menu_item_id' => $menuItem->id,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
            ];
        }

        $order = Order::create([
            'user_id' => $user->id,
            'staff_id' => $request->user()->id,
            'total_amount' => $totalAmount,
            'status' => 'pending_payment',
        ]);

        foreach ($orderItemsData as $data) {
            $data['order_id'] = $order->id;
            OrderItem::create($data);
        }

        // Trigger WalletActivity Push Notification
        $user->notify(new WalletActivity([
            'title' => 'Catering Bill Pending',
            'message' => "New Bill from Catering: ₹{$totalAmount}. Tap to pay.",
            'type' => 'debit_request',
            'amount' => $totalAmount,
            'order_id' => $order->id,
        ]));

        $qrPayload = base64_encode(json_encode([
            'order_id' => $order->id,
            'amount' => $totalAmount,
            'timestamp' => now()->timestamp,
        ]));

        return response()->json([
            'order_id' => $order->id,
            'qr_payload' => $qrPayload,
        ]);
    }

    public function getOrderStatus($order_id)
    {
        $order = Order::findOrFail($order_id);
        return response()->json(['status' => $order->status]);
    }
}
