<?php

namespace App\Actions\Auth;

use App\Models\User;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LoginAction
{
    public function execute(Request $request, array $credentials): User
    {
        if (! Auth::attempt($credentials)) {
            abort(422, 'Identifiants invalides.');
        }
        $user = Auth::user();
        if (! $user->hasVerifiedEmail()) {
            Auth::guard('web')->logout();
            Auth::forgetGuards();
            if ($request->hasSession()) {
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            } throw new HttpResponseException(response()->json(['message' => 'Votre adresse email doit être vérifiée avant de vous connecter.', 'code' => 'email_unverified'], 422));
        }
        $request->session()->regenerate();

        return $user;
    }
}
