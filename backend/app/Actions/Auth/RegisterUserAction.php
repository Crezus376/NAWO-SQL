<?php

namespace App\Actions\Auth;

use App\Enums\UserRole as UserRoleEnum;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\DB;

class RegisterUserAction
{
    public function execute(array $data): User
    {
        $user = DB::transaction(function () use ($data) {
            $user = User::create(['email' => strtolower($data['email']), 'password' => $data['password'], 'email_verified_at' => null]);
            UserRole::create(['user_id' => $user->id, 'role' => UserRoleEnum::Organizer]);

            return $user;
        });
        event(new Registered($user));

        return $user;
    }
}
