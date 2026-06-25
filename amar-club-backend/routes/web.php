<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\InvoiceController;

Route::get('/', function () {
    return redirect('/admin');
});

Route::get('/orders/{order}/invoice', [InvoiceController::class, 'print'])->name('invoice.print')->middleware('auth');
Route::get('/download-sample', [\App\Http\Controllers\SampleDownloadController::class, 'download'])->name('download.sample')->middleware('auth');


