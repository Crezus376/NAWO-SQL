<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DataController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\PublicController;
use App\Http\Controllers\ScanController;
use App\Http\Controllers\WithdrawalController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');
    Route::post('/resend-verification', [AuthController::class, 'resendVerification']);
    Route::get('/verify-email/{user}/{hash}', [AuthController::class, 'verifyEmail'])
        ->name('verification.verify');
    Route::post('/forgot-password', [AuthController::class, 'forgot'])->middleware('throttle:password-reset');
    Route::post('/reset-password', [AuthController::class, 'reset'])->middleware('throttle:password-reset');
    Route::middleware(['auth:sanctum', 'valid.user.role', 'verified.user.email'])->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::patch('/profile', [AuthController::class, 'updateProfile']);
        Route::post('/password', [AuthController::class, 'updatePassword']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/logout-all', [AuthController::class, 'logoutAll']);
    });
});

Route::get('/events', [PublicController::class, 'events']);
Route::get('/events/{slug}', [PublicController::class, 'event']);
Route::post('/events/{slug}/purchase', [PublicController::class, 'purchase'])->middleware('throttle:purchase');
Route::get('/tickets/{id}', [PublicController::class, 'ticket']);
Route::post('/scan/login', [ScanController::class, 'login'])->middleware('throttle:scan');
Route::post('/scan/ticket', [ScanController::class, 'scan'])->middleware('throttle:scan');
Route::post('/scan/stats', [ScanController::class, 'stats'])->middleware('throttle:scan');
Route::get('/data/{table}', [DataController::class, 'index']);

Route::middleware(['auth:sanctum', 'valid.user.role', 'verified.user.email'])->group(function () {
    Route::post('/data/{table}', [DataController::class, 'store']);
    Route::put('/data/{table}', [DataController::class, 'update']);
    Route::delete('/data/{table}', [DataController::class, 'destroy']);
    Route::post('/uploads/{bucket}', [DataController::class, 'upload']);
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/dashboard/events', [EventController::class, 'index']);
    Route::post('/dashboard/events', [EventController::class, 'store']);
    Route::get('/dashboard/events/{event}', [EventController::class, 'show']);
    Route::match(['put', 'post'], '/dashboard/events/{event}', [EventController::class, 'update']);
    Route::delete('/dashboard/events/{event}', [EventController::class, 'destroy']);
    Route::get('/dashboard/events/{event}/overview', [EventController::class, 'overview']);
    Route::get('/dashboard/events/{event}/{resource}', [EventController::class, 'listResource']);
    Route::post('/dashboard/events/{event}/{resource}', [EventController::class, 'createResource']);
    Route::match(['put', 'post'], '/dashboard/events/{event}/{resource}/{id}', [EventController::class, 'updateResource']);
    Route::delete('/dashboard/events/{event}/{resource}/{id}', [EventController::class, 'deleteResource']);
    Route::get('/withdrawals', [WithdrawalController::class, 'index']);
    Route::post('/withdrawals', [WithdrawalController::class, 'store']);
    Route::get('/withdrawals/{withdrawal}/receipt', [WithdrawalController::class, 'receipt']);
    Route::get('/files/withdrawal-proofs/{withdrawal}', [AdminController::class, 'proof']);

    Route::prefix('admin')->middleware('admin')->group(function () {
        Route::get('/overview', [AdminController::class, 'overview']);
        Route::get('/events', [AdminController::class, 'events']);
        Route::get('/pages', [AdminController::class, 'pages']);
        Route::put('/pages/{page}', [AdminController::class, 'updatePage']);
        Route::get('/templates', [AdminController::class, 'templates']);
        Route::post('/templates', [AdminController::class, 'storeTemplate']);
        Route::match(['put', 'post'], '/templates/{template}', [AdminController::class, 'updateTemplate']);
        Route::get('/withdrawals', [AdminController::class, 'withdrawals']);
        Route::post('/withdrawals/{withdrawal}', [AdminController::class, 'processWithdrawal']);
    });
});
