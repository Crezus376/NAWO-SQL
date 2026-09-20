<?php

namespace App\Policies;

use App\Models\Event;
use App\Models\EventSession;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class EventSessionPolicy
{
    public function viewAny(User $user, Event $event): Response
    {
        return $this->owns($user, $event);
    }

    public function create(User $user, Event $event): Response
    {
        return $this->owns($user, $event);
    }

    public function update(User $user, EventSession $session): Response
    {
        return $this->owns($user, $session->event);
    }

    public function delete(User $user, EventSession $session): Response
    {
        return $this->owns($user, $session->event);
    }

    private function owns(User $user, Event $event): Response
    {
        return $event->organizer_id === $user->id ? Response::allow() : Response::denyAsNotFound();
    }
}
