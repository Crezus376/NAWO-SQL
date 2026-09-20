<?php

namespace App\Policies;

use App\Models\TicketTemplate;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class TicketTemplatePolicy
{
    public function administerAny(User $user): Response
    {
        return $this->admin($user);
    }

    public function create(User $user): Response
    {
        return $this->admin($user);
    }

    public function update(User $user, TicketTemplate $template): Response
    {
        return $this->admin($user);
    }

    private function admin(User $user): Response
    {
        return $user->isAdmin() ? Response::allow() : Response::denyAsNotFound();
    }
}
