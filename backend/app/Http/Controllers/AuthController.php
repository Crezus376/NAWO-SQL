<?php

namespace App\Http\Controllers;

use App\Enums\UserRole as UserRoleEnum;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate(['email' => ['required', 'string', 'email', 'max:255', 'not_regex:/[\r\n]/', 'unique:users,email'], 'password' => ['required', 'confirmed', PasswordRule::min((int) config('auth.password_min_length', 8))]]);
        $user = DB::transaction(function () use ($data) {
            $user = User::create(['email' => strtolower($data['email']), 'password' => $data['password'], 'email_verified_at' => null]);
            UserRole::create(['user_id' => $user->id, 'role' => UserRoleEnum::Organizer]);

            return $user;
        });
        event(new Registered($user));

        return response()->json(['data' => $this->present($user)], 201);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate(['email' => ['required', 'string', 'email', 'not_regex:/[\r\n]/'], 'password' => 'required|string']);
        if (! Auth::attempt(['email' => strtolower($credentials['email']), 'password' => $credentials['password']])) {
            return response()->json(['message' => 'Identifiants invalides.'], 422);
        }

        /** @var User $user */
        $user = Auth::user();
        if (! $user->hasVerifiedEmail()) {
            $this->invalidateAuthentication($request);

            return response()->json([
                'message' => 'Votre adresse email doit être vérifiée avant de vous connecter.',
                'code' => 'email_unverified',
            ], 422);
        }

        $request->session()->regenerate();

        return ['data' => $this->present($user)];
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }

    public function logoutAll(Request $request)
    {
        $user = $request->user();
        $user->tokens()->delete();
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        if (config('session.driver') === 'database') {
            DB::table(config('session.table', 'sessions'))->where('user_id', $user->id)->delete();
        }

        return response()->noContent();
    }

    public function me(Request $request)
    {
        return ['data' => $this->present($request->user())];
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        $data = $request->validate([
            'full_name' => ['nullable', 'string', 'max:255'],
            'email' => ['prohibited'],
        ]);

        $user->update(['full_name' => $data['full_name'] ?? null]);

        return ['data' => $this->present($user)];
    }

    public function updatePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => ['required', 'current_password:web'],
            'password' => ['required', 'confirmed', PasswordRule::min((int) config('auth.password_min_length', 8))],
        ]);

        $request->user()->update(['password' => $data['password']]);

        return ['data' => ['updated' => true]];
    }

    public function forgot(Request $request)
    {
        $request->validate(['email' => ['required', 'string', 'email', 'not_regex:/[\r\n]/']]);
        Password::sendResetLink($request->only('email'));

        return ['data' => ['sent' => true]];
    }

    public function resendVerification(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255', 'not_regex:/[\r\n]/'],
        ]);
        $email = strtolower($data['email']);
        $key = 'email-verification:'.hash('sha256', $email);
        $response = [
            'data' => ['sent' => true],
            'message' => 'Si un compte existe et que son adresse n’est pas encore vérifiée, un email a été envoyé.',
        ];

        if (config('app.env') === 'production' && RateLimiter::tooManyAttempts($key, 5)) {
            return $response;
        }

        if (config('app.env') === 'production') {
            RateLimiter::hit($key, 86400);
        }
        $user = User::where('email', $email)->first();
        if ($user && ! $user->hasVerifiedEmail()) {
            $user->sendEmailVerificationNotification();
        }

        return $response;
    }

    public function verifyEmail(Request $request, User $user, string $hash)
    {
        $path = rtrim(config('app.frontend_email_verification_path'), '/');
        $redirect = fn (string $status) => redirect()->to(
            rtrim(config('app.frontend_url'), '/').$path.'?status='.$status.'&email='.urlencode($user->email),
        );

        if (! $request->hasValidSignature() || ! hash_equals(sha1($user->getEmailForVerification()), $hash)) {
            return $redirect('invalid');
        }

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }

        return $redirect('verified');
    }

    public function reset(Request $request)
    {
        $data = $request->validate(['token' => 'required', 'email' => ['required', 'string', 'email', 'not_regex:/[\r\n]/'], 'password' => ['required', 'confirmed', PasswordRule::min((int) config('auth.password_min_length', 8))]]);
        $status = Password::reset($data, function (User $user, string $password) {
            $user->forceFill(['password' => Hash::make($password), 'remember_token' => Str::random(60)])->save();
            event(new PasswordReset($user));
        });
        if ($status !== Password::PASSWORD_RESET) {
            return response()->json(['message' => __($status)], 422);
        }

        return ['data' => ['reset' => true]];
    }

    private function present(User $user): array
    {
        $user->loadMissing('roles');
        $roles = $user->roles->pluck('role')->map(fn (UserRoleEnum $role) => $role->value)->values();

        return ['id' => $user->id, 'email' => $user->email, 'full_name' => $user->full_name, 'email_verified' => $user->hasVerifiedEmail(), 'roles' => $roles, 'is_admin' => $roles->contains('admin')];
    }

    private function invalidateAuthentication(Request $request): void
    {
        Auth::guard('web')->logout();
        Auth::forgetGuards();
        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }
    }
}
