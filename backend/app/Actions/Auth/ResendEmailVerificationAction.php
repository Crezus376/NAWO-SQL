<?php

namespace App\Actions\Auth;

use App\Models\User;
use Illuminate\Support\Facades\RateLimiter;

class ResendEmailVerificationAction
{
    public function execute(string $email): void
    {
        $key = 'email-verification:'.hash('sha256', $email);
        if (config('app.env') === 'production' && RateLimiter::tooManyAttempts($key, 5)) {
            return;
        } if (config('app.env') === 'production') {
            RateLimiter::hit($key, 86400);
        } $user = User::where('email', $email)->first();
        if ($user && ! $user->hasVerifiedEmail()) {
            $user->sendEmailVerificationNotification();
        }
    }
}
