<?php

namespace App\Observers;

use App\Models\Order;

class OrderObserver
{
    protected function logHistory(Order $order, string $action)
    {
        \App\Models\OrderHistory::create([
            'order_id' => $order->id,
            'user_id' => auth()->id() ?? $order->staff_id,
            'action' => $action,
            'changes' => $order->getChanges() ?: $order->getAttributes(),
        ]);
    }

    public function created(Order $order): void
    {
        $this->logHistory($order, 'created');
    }

    public function updated(Order $order): void
    {
        if ($order->isDirty('status')) {
            $this->logHistory($order, 'status_changed to ' . $order->status);
        } else {
            $this->logHistory($order, 'updated');
        }
    }

    public function deleted(Order $order): void
    {
        if ($order->isForceDeleting()) {
            $this->logHistory($order, 'force_deleted');
        } else {
            $this->logHistory($order, 'archived');
        }
    }

    public function restored(Order $order): void
    {
        $this->logHistory($order, 'restored');
    }

    public function forceDeleted(Order $order): void
    {
        $this->logHistory($order, 'force_deleted');
    }
}
