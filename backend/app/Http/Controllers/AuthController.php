<?php

namespace App\Http\Controllers;

use App\Models\Profile;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate(['email' => ['required', 'string', 'email', 'max:255', 'not_regex:/[\r\n]/', 'unique:users,email'], 'password' => ['required', 'confirmed', PasswordRule::min((int) config('auth.password_min_length', 8))]]);
        $user = DB::transaction(function () use ($data) {
            $user = User::create(['email' => strtolower($data['email']), 'password' => $data['password'], 'email_verified_at' => now()]);
            Profile::create(['id' => $user->id, 'email' => $user->email]);
            UserRole::create(['user_id' => $user->id, 'role' => 'organizer']);

            return $user;
        });
        Auth::login($user);
        $request->session()->regenerate();

        return response()->json(['data' => $this->present($user)], 201);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate(['email' => ['required', 'string', 'email', 'not_regex:/[\r\n]/'], 'password' => 'required|string']);
        if (! Auth::attempt(['email' => strtolower($credentials['email']), 'password' => $credentials['password']])) {
            return response()->json(['message' => 'Identifiants invalides.'], 422);
        }
        $request->session()->regenerate();

        return ['data' => $this->present($request->user())];
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

    public function destroy(Request $request)
    {
        $request->validate(['password' => 'required|current_password:web']);
        $user = $request->user();
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $user->delete();

        return response()->noContent();
    }

    public function forgot(Request $request)
    {
        $request->validate(['email' => ['required', 'string', 'email', 'not_regex:/[\r\n]/']]);
        Password::sendResetLink($request->only('email'));

        return ['data' => ['sent' => true]];
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
        $user->loadMissing('profile', 'roles');
        $roles = $user->roles->pluck('role')->values();

        return ['id' => $user->id, 'email' => $user->email, 'profile' => $user->profile, 'roles' => $roles, 'is_admin' => $roles->contains('admin')];
    }
}
