<?php

namespace App\Actions\Auth;

use App\Models\User;

class UpdateCurrentUserAction
{
    public function execute(User $user, array $data): User
    {
        $user->update(['full_name' => $data['full_name'] ?? null]);

        return $user->fresh();
    }
}
