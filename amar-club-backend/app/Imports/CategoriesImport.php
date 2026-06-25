<?php

namespace App\Imports;

use App\Models\Category;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class CategoriesImport implements ToModel, WithHeadingRow
{
    public function model(array $row)
    {
        return Category::firstOrCreate(
            ['name' => $row['name']],
            [
                'is_active' => strtolower($row['is_active'] ?? 'true') === 'true' || $row['is_active'] == 1,
            ]
        );
    }
}
