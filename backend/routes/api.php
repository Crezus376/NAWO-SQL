<?php

use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\EventController as AdminEventController;
use App\Http\Controllers\Admin\EventPageController as AdminEventPageController;
use App\Http\Controllers\Admin\TicketTemplateController as AdminTicketTemplateController;
use App\Http\Controllers\Admin\TicketTypeController as AdminTicketTypeController;
use App\Http\Controllers\Admin\WithdrawalController as AdminWithdrawalController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\UserController;
use App\Http\Controllers\Organizer\AmbassadorController as OrganizerAmbassadorController;
use App\Http\Controllers\Organizer\DashboardController as OrganizerDashboardController;
use App\Http\Controllers\Organizer\EventController as OrganizerEventController;
use App\Http\Controllers\Organizer\EventOverviewController as OrganizerEventOverviewController;
use App\Http\Controllers\Organizer\EventPageController as OrganizerEventPageController;
use App\Http\Controllers\Organizer\EventSessionController as OrganizerEventSessionController;
use App\Http\Controllers\Organizer\HostController as OrganizerHostController;
use App\Http\Controllers\Organizer\PromoCodeController as OrganizerPromoCodeController;
use App\Http\Controllers\Organizer\TicketTypeController as OrganizerTicketTypeController;
use App\Http\Controllers\Organizer\WithdrawalController as OrganizerWithdrawalController;
use App\Http\Controllers\Organizer\WithdrawalReceiptController;
use App\Http\Controllers\PublicApi\EventController as PublicEventController;
use App\Http\Controllers\PublicApi\OrderController as PublicOrderController;
use App\Http\Controllers\PublicApi\TicketController as PublicTicketController;
use App\Http\Controllers\Scan\HostSessionController;
use App\Http\Controllers\Scan\ScanController;
use App\Http\Controllers\WithdrawalProofController;
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
    Route::post('/users', [AuthController::class, 'register']);
    Route::post('/sessions', [AuthController::class, 'login'])->middleware('throttle:login');
    Route::post('/email-verification-notifications', [AuthController::class, 'sendVerification']);
    Route::get('/email-verifications/{user}/{hash}', [AuthController::class, 'verifyEmail'])
        ->name('verification.verify');
    Route::post('/password-reset-links', [AuthController::class, 'sendResetLink'])->middleware('throttle:password-reset');
    Route::post('/password-resets', [AuthController::class, 'resetPassword'])->middleware('throttle:password-reset');
    Route::middleware(['auth:sanctum', 'valid.user.role', 'verified.user.email'])->group(function () {
        Route::get('/user', [AuthController::class, 'me']);
        Route::patch('/user', [UserController::class, 'updateData']);
        Route::patch('/user/password', [UserController::class, 'updatePassword']);
        Route::delete('/session', [AuthController::class, 'logout']);
    });
});

Route::get('/events', [PublicEventController::class, 'index']);
Route::get('/events/{event:slug}', [PublicEventController::class, 'show']);
Route::post('/events/{event:slug}/orders', [PublicOrderController::class, 'store'])->middleware('throttle:purchase');
Route::get('/tickets/{ticket}', [PublicTicketController::class, 'show']);
Route::post('/scan/host-sessions', [HostSessionController::class, 'store'])->middleware('throttle:scan');
Route::post('/scan/attempts', [ScanController::class, 'attempt'])->middleware('throttle:scan');
Route::post('/scan/statistics', [ScanController::class, 'statistics'])->middleware('throttle:scan');
Route::middleware(['auth:sanctum', 'valid.user.role', 'verified.user.email'])->group(function () {
    Route::prefix('organizer')->scopeBindings()->group(function () {
        Route::get('/dashboard', [OrganizerDashboardController::class, 'show']);
        Route::apiResource('events', OrganizerEventController::class);
        Route::get('/events/{event}/overview', [OrganizerEventOverviewController::class, 'show']);
        Route::get('/events/{event}/page', [OrganizerEventPageController::class, 'show']);
        Route::patch('/events/{event}/page', [OrganizerEventPageController::class, 'update']);
        Route::apiResource('events.sessions', OrganizerEventSessionController::class)->shallow(false);
        Route::apiResource('events.ticket-types', OrganizerTicketTypeController::class)
            ->parameters(['ticket-types' => 'ticketType']);
        Route::apiResource('events.promo-codes', OrganizerPromoCodeController::class)
            ->parameters(['promo-codes' => 'promoCode']);
        Route::apiResource('events.ambassadors', OrganizerAmbassadorController::class);
        Route::apiResource('events.hosts', OrganizerHostController::class);
        Route::get('/withdrawals', [OrganizerWithdrawalController::class, 'index']);
        Route::post('/withdrawals', [OrganizerWithdrawalController::class, 'store']);
        Route::get('/withdrawals/{withdrawal}/receipt', [WithdrawalReceiptController::class, 'show']);
    });
    Route::get('/withdrawals/{withdrawal}/proof', [WithdrawalProofController::class, 'show']);

    Route::prefix('admin')->middleware('admin')->group(function () {
        Route::get('/dashboard', [AdminDashboardController::class, 'show']);
        Route::apiResource('events', AdminEventController::class)->only(['index', 'show']);
        Route::apiResource('event-pages', AdminEventPageController::class)
            ->only(['index', 'update'])
            ->parameters(['event-pages' => 'eventPage']);
        Route::apiResource('ticket-types', AdminTicketTypeController::class)->only(['index']);
        Route::apiResource('ticket-templates', AdminTicketTemplateController::class)
            ->only(['index', 'store', 'update'])
            ->parameters(['ticket-templates' => 'ticketTemplate']);
        Route::apiResource('withdrawals', AdminWithdrawalController::class)->only(['index', 'update']);
    });
});
