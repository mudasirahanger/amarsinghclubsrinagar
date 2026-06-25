<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class SampleDownloadController extends Controller
{
    public function download(Request $request)
    {
        $type = $request->query('type');
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="sample_' . $type . '.csv"',
        ];

        $columns = [];
        
        if ($type === 'members') {
            $columns = ['name', 'email', 'phone', 'member_id', 'wallet_balance', 'member_tier', 'status'];
        } elseif ($type === 'menu_items') {
            $columns = ['name', 'category', 'price', 'tax_gst', 'discount', 'is_available'];
        } elseif ($type === 'categories') {
            $columns = ['name', 'is_active'];
        } else {
            abort(404);
        }

        $callback = function () use ($columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);
            
            // Add a sample row
            if ($columns[0] === 'name' && count($columns) > 2) {
                if (in_array('email', $columns)) {
                    fputcsv($file, ['John Doe', 'john@example.com', '1234567890', 'M-1234', '100.00', 'Gold', 'active']);
                } else {
                    fputcsv($file, ['Chicken Tikka', 'Starters', '250', '5', '0', 'true']);
                }
            } elseif (count($columns) == 2) {
                fputcsv($file, ['Starters', 'true']);
            }
            
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
