<?php

namespace App\Policies;

use App\Models\Event;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class EventPolicy
{
    public function create(User $user): Response
    {
        return Response::allow();
    }

    public function view(User $user, Event $event): Response
    {
        return $event->organizer_id === $user->id ? Response::allow() : Response::denyAsNotFound();
    }

    public function update(User $user, Event $event): Response
    {
        return $this->view($user, $event);
    }

    public function delete(User $user, Event $event): Response
    {
        return $this->view($user, $event);
    }

    public function administer(User $user, Event $event): Response
    {
        return $user->isAdmin() ? Response::allow() : Response::denyAsNotFound();
    }

    public function administerAny(User $user): Response
    {
        return $user->isAdmin() ? Response::allow() : Response::denyAsNotFound();
    }
}
