<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class Transaction extends Model
{
    use HasFactory, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['status', 'amount', 'type'])
            ->logOnlyDirty();
    }

    protected $fillable = [
        'user_id',
        'transaction_id',
        'type',
        'amount',
        'payment_method',
        'status',
        'reference_id',
        'description',
    ];

    // A transaction belongs to a user
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    protected static function booted()
    {
        static::saved(function ($transaction) {
            \Illuminate\Support\Facades\Cache::forget('user_' . $transaction->user_id . '_transactions');
        });

        static::deleted(function ($transaction) {
            \Illuminate\Support\Facades\Cache::forget('user_' . $transaction->user_id . '_transactions');
        });
    }
}