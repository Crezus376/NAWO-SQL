<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        ResetPassword::createUrlUsing(function (User $user, string $token) {
            return rtrim(config('app.frontend_url'), '/').config('app.frontend_password_reset_path').'?token='.$token.'&email='.urlencode($user->email);
        });

        VerifyEmail::createUrlUsing(function (User $user) {
            return URL::temporarySignedRoute(
                'verification.verify',
                now()->addMinutes((int) config('auth.verification.expire', 60)),
                ['user' => $user->getKey(), 'hash' => sha1($user->getEmailForVerification())],
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
