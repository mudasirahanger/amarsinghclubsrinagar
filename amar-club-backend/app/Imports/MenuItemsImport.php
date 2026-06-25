<?php

namespace App\Imports;

use App\Models\MenuItem;
use App\Models\Category;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class MenuItemsImport implements ToModel, WithHeadingRow
{
    public function model(array $row)
    {
        $category = Category::firstOrCreate(['name' => $row['category'] ?? 'Default']);

        return MenuItem::firstOrCreate(
            ['name' => $row['name']],
            [
                'price' => $row['price'] ?? 0,
                'category_id' => $category->id,
                'tax_gst' => $row['tax_gst'] ?? 0,
                'discount' => $row['discount'] ?? 0,
                'is_available' => strtolower($row['is_available'] ?? 'true') === 'true' || $row['is_available'] == 1,
            ]
        );
    }
}
