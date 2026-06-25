<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice - {{ $order->id }}</title>
    <style>
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 12px;
            color: #000;
            margin: 0;
            padding: 5px;
            width: 100%;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .font-bold { font-weight: bold; }
        
        .header {
            margin-bottom: 10px;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
        }
        .header h2 {
            margin: 0 0 5px 0;
            font-size: 16px;
        }
        .header p {
            margin: 2px 0;
            font-size: 11px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }
        th, td {
            padding: 3px 0;
            font-size: 11px;
            vertical-align: top;
        }
        th {
            border-bottom: 1px dashed #000;
            text-align: left;
        }
        .item-name { width: 50%; }
        .item-qty { width: 15%; text-align: center; }
        .item-price { width: 35%; text-align: right; }

        .totals {
            border-top: 1px dashed #000;
            margin-top: 5px;
            padding-top: 5px;
        }
        .totals-table {
            width: 100%;
        }
        .totals-table td {
            padding: 2px 0;
        }
        
        .qr-section {
            text-align: center;
            margin-top: 15px;
            border-top: 1px dashed #000;
            padding-top: 15px;
        }
        .qr-section img {
            width: 80px;
            height: 80px;
        }
        .footer {
            text-align: center;
            margin-top: 10px;
            font-size: 10px;
        }
    </style>
</head>
<body>

    <div class="header text-center">
        <h2>AMAR SINGH CLUB</h2>
        <p>Order #: {{ $order->id }}</p>
        <p>Date: {{ $order->created_at->format('d M Y, h:i A') }}</p>
        <p>Member: {{ $order->user->name ?? 'Guest' }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th class="item-name">Item</th>
                <th class="item-qty">Qty</th>
                <th class="item-price">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($order->orderItems as $item)
            <tr>
                <td class="item-name">{{ $item->menuItem->name ?? 'Unknown Item' }}</td>
                <td class="item-qty">{{ $item->quantity }}</td>
                <td class="item-price">₹{{ number_format($item->quantity * $item->unit_price, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="totals">
        <table class="totals-table">
            @php
                $subtotal = 0;
                $totalTax = 0;
                foreach($order->orderItems as $item) {
                    $itemTotal = $item->quantity * $item->unit_price;
                    $gstRate = $item->menuItem ? $item->menuItem->tax_gst : 0;
                    $itemTax = $itemTotal * ($gstRate / 100);
                    $subtotal += $itemTotal;
                    $totalTax += $itemTax;
                }
            @endphp
            <tr>
                <td class="text-left" style="font-size: 12px;">Subtotal:</td>
                <td class="text-right" style="font-size: 12px;">₹{{ number_format($subtotal, 2) }}</td>
            </tr>
            <tr>
                <td class="text-left" style="font-size: 12px; border-bottom: 1px dashed #000; padding-bottom: 5px;">GST:</td>
                <td class="text-right" style="font-size: 12px; border-bottom: 1px dashed #000; padding-bottom: 5px;">₹{{ number_format($totalTax, 2) }}</td>
            </tr>
            <tr>
                <td class="text-left font-bold" style="font-size: 14px; padding-top: 5px;">TOTAL:</td>
                <td class="text-right font-bold" style="font-size: 14px; padding-top: 5px;">₹{{ number_format($order->total_amount, 2) }}</td>
            </tr>
        </table>
    </div>

    <div class="qr-section">
        <img src="data:image/svg+xml;base64,{{ $qrCode }}" alt="QR Code" />
    </div>

    <div class="footer">
        <p>You can use the membership app to scan the QR for fast payments.</p>
        <p>Thank You! Visit Again.</p>
    </div>

</body>
</html>
