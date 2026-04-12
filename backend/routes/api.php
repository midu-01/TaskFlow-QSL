<?php

use App\Http\Controllers\Api\TaskController;
use Illuminate\Support\Facades\Route;

Route::prefix('tasks')->group(function (): void {
    Route::get('/', [TaskController::class, 'index']);
    Route::post('/', [TaskController::class, 'store']);
    Route::get('/{id}', [TaskController::class, 'show'])->whereNumber('id');
    Route::put('/{id}', [TaskController::class, 'update'])->whereNumber('id');
    Route::patch('/{id}/status', [TaskController::class, 'updateStatus'])->whereNumber('id');
    Route::delete('/{id}', [TaskController::class, 'destroy'])->whereNumber('id');
});
