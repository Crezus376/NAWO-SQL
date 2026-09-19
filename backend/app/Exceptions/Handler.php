<?php

namespace App\Exceptions;

use App\Enums\UserRole as UserRoleEnum;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Support\Facades\Auth;
use RuntimeException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;
use ValueError;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->renderable(function (ValueError $e, $request) {
            if ($request->is('api/*') && str_contains($e->getMessage(), UserRoleEnum::class)) {
                Auth::guard('web')->logout();
                Auth::forgetGuards();
                if ($request->hasSession()) {
                    $request->session()->invalidate();
                    $request->session()->regenerateToken();
                }

                return response()->json([
                    'message' => 'Impossible de vous connecter pour le moment. Contactez l’équipe technique.',
                ], 422);
            }

            return null;
        });

        $this->renderable(function (RuntimeException $e, $request) {
            if ($e instanceof HttpExceptionInterface) {
                return null;
            }
            if ($request->is('api/*')) {
                return response()->json(['message' => $e->getMessage()], 422);
            }
        });
        $this->reportable(function (Throwable $e) {
            //
        });
    }
}
