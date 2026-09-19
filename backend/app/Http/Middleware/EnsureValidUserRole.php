<?php

namespace App\Http\Middleware;

use App\Enums\UserRole as UserRoleEnum;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use ValueError;

class EnsureValidUserRole
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        try {
            $user->roles()->get()->each(fn ($role) => $role->role);
        } catch (ValueError $e) {
            if (! str_contains($e->getMessage(), UserRoleEnum::class)) {
                throw $e;
            }

            $this->invalidateAuthentication($request, $user);

            return response()->json([
                'message' => 'Impossible de vous connecter pour le moment. Contactez l’équipe technique.',
            ], 422);
        }

        return $next($request);
    }

    private function invalidateAuthentication(Request $request, $user): void
    {
        $token = $user->currentAccessToken();
        if ($token && method_exists($token, 'delete')) {
            $token->delete();
        }

        Auth::guard('web')->logout();
        Auth::forgetGuards();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }
    }
}
