<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Withdrawal;
use Illuminate\Auth\Access\Response;

class WithdrawalPolicy
{
    public function create(User $user): Response
    {
        return Response::allow();
    }

    public function view(User $user, Withdrawal $withdrawal): Response
    {
        return $withdrawal->organizer_id === $user->id || $user->isAdmin() ? Response::allow() : Response::deny();
    }

    public function administer(User $user, Withdrawal $withdrawal): Response
    {
        return $user->isAdmin() ? Response::allow() : Response::denyAsNotFound();
    }

    public function administerAny(User $user): Response
    {
        return $user->isAdmin() ? Response::allow() : Response::denyAsNotFound();
    }
}
