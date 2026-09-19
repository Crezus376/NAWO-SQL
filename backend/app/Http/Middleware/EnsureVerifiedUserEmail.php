<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EnsureVerifiedUserEmail
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (! $user || $user->hasVerifiedEmail()) {
            return $next($request);
        }

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

        return response()->json([
            'message' => 'Votre adresse email doit être vérifiée avant de continuer.',
            'code' => 'email_unverified',
        ], 422);
    }
}
