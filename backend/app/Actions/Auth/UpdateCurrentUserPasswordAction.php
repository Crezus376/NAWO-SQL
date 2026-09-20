<?php

namespace App\Actions\Auth;

use App\Models\User;
use Illuminate\Http\Request;

class UpdateCurrentUserPasswordAction
{
    public function __construct(private readonly RevokeOtherSessionsAction $revokeOtherSessions) {}

    public function execute(User $user, string $password, Request $request): void
    {
        $user->update(['password' => $password]);
        $this->revokeOtherSessions->execute($request);
    }
}
