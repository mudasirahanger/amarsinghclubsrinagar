<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Barryvdh\DomPDF\Facade\Pdf;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function print(Order $order)
    {
        $order->load(['user', 'orderItems.menuItem']);

        // Generate a JSON payload for the mobile app to scan and pay
        $qrPayload = [
            'type' => 'kot_order',
            'order_id' => $order->id,
            'total_amount' => $order->total_amount,
        ];
        
        $qrData = json_encode($qrPayload);
        
        $qrCode = base64_encode(QrCode::encoding('UTF-8')->format('svg')->size(100)->generate($qrData));

        $pdf = Pdf::loadView('pdf.invoice', [
            'order' => $order,
            'qrCode' => $qrCode,
        ]);

        // KOT printers usually use 80mm width. 80mm is ~226pt
        // 80mm x 297mm (dynamic height)
        $pdf->setPaper([0, 0, 226.77, 800], 'portrait'); 

        return $pdf->stream("invoice-{$order->id}.pdf");
    }
}
