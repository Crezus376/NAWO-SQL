<?php

namespace App\Policies;

use App\Models\Event;
use App\Models\EventPage;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class EventPagePolicy
{
    public function viewForEvent(User $user, Event $event): Response
    {
        return $this->owns($user, $event);
    }

    public function updateForEvent(User $user, Event $event): Response
    {
        return $this->owns($user, $event);
    }

    public function administer(User $user, EventPage $page): Response
    {
        return $user->isAdmin() ? Response::allow() : Response::denyAsNotFound();
    }

    public function administerAny(User $user): Response
    {
        return $user->isAdmin() ? Response::allow() : Response::denyAsNotFound();
    }

    private function owns(User $user, Event $event): Response
    {
        return $event->organizer_id === $user->id ? Response::allow() : Response::denyAsNotFound();
    }
}
