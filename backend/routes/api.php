<?php

use App\Http\Controllers\Api\TaskController;
use Illuminate\Support\Facades\Route;

Route::prefix('tasks')->group(function (): void {
    Route::get('/', [TaskController::class, 'index']);
    Route::get('/archived', [TaskController::class, 'archived']);
    Route::post('/', [TaskController::class, 'store']);
    Route::delete('/{task}/force', [TaskController::class, 'forceDelete'])->whereNumber('task');
    Route::patch('/{task}/restore', [TaskController::class, 'restore'])->whereNumber('task');
    Route::get('/{task}', [TaskController::class, 'show'])->whereNumber('task');
    Route::put('/{task}', [TaskController::class, 'update'])->whereNumber('task');
    Route::patch('/{task}/status', [TaskController::class, 'updateStatus'])->whereNumber('task');
    Route::delete('/{task}', [TaskController::class, 'destroy'])->whereNumber('task');
});
