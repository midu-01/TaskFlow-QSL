<?php

use App\Http\Controllers\Api\TaskController;
use Illuminate\Support\Facades\Route;

Route::prefix('tasks')->group(function (): void {
    Route::get('/', [TaskController::class, 'index']);
    Route::post('/', [TaskController::class, 'store']);
    Route::get('/{task}', [TaskController::class, 'show'])->whereNumber('task');
    Route::put('/{task}', [TaskController::class, 'update'])->whereNumber('task');
    Route::patch('/{task}/status', [TaskController::class, 'updateStatus'])->whereNumber('task');
    Route::delete('/{task}', [TaskController::class, 'destroy'])->whereNumber('task');
});
