<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MenuItem extends Model
{
    use \Illuminate\Database\Eloquent\Factories\HasFactory;

    protected $fillable = [
        'name',
        'category_id',
        'price',
        'is_available',
        'image_url',
        'tax_gst',
        'discount',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}
