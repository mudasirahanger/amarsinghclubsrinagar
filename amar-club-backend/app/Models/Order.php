<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use \Illuminate\Database\Eloquent\Factories\HasFactory, \Illuminate\Database\Eloquent\SoftDeletes;

    protected $fillable = [
        'user_id',
        'staff_id',
        'total_amount',
        'total_tax',
        'status',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function staff()
    {
        return $this->belongsTo(User::class, 'staff_id');
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function orderHistories()
    {
        return $this->hasMany(OrderHistory::class)->orderBy('created_at', 'desc');
    }

    protected static function booted()
    {
        static::deleting(function ($order) {
            // Delete related transactions (Activity) and fire their events
            $transactions = \App\Models\Transaction::where('reference_id', 'ORD-' . $order->id)->get();
            foreach ($transactions as $txn) {
                $txn->delete();
            }
            
            // Delete related notifications
            if ($order->user) {
                foreach ($order->user->notifications as $notification) {
                    if (isset($notification->data['order_id']) && $notification->data['order_id'] == $order->id) {
                        $notification->delete();
                    }
                }
            }
        });
    }
}
