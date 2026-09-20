<?php

namespace App\Actions\Auth;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RevokeOtherSessionsAction
{
    public function execute(Request $request): void
    {
        $user = $request->user();
        $currentToken = $user->currentAccessToken();
        $tokens = $user->tokens();
        if ($currentToken && method_exists($currentToken, 'getKey')) {
            $tokens->whereKeyNot($currentToken->getKey());
        }
        $tokens->delete();

        if (config('session.driver') === 'database') {
            $sessions = DB::table(config('session.table', 'sessions'))->where('user_id', $user->id);
            if ($request->hasSession()) {
                $sessions->where('id', '!=', $request->session()->getId());
            }
            $sessions->delete();
        }
    }
}
