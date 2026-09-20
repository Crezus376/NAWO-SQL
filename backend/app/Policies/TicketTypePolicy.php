<?php

namespace App\Policies;

use App\Models\Event;
use App\Models\TicketType;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class TicketTypePolicy
{
    public function viewAny(User $user, Event $event): Response
    {
        return $this->owns($user, $event);
    }

    public function create(User $user, Event $event): Response
    {
        return $this->owns($user, $event);
    }

    public function update(User $user, TicketType $ticketType): Response
    {
        return $this->owns($user, $ticketType->event);
    }

    public function delete(User $user, TicketType $ticketType): Response
    {
        return $this->owns($user, $ticketType->event);
    }

    public function administer(User $user): Response
    {
        return $user->isAdmin() ? Response::allow() : Response::denyAsNotFound();
    }

    private function owns(User $user, Event $event): Response
    {
        return $event->organizer_id === $user->id ? Response::allow() : Response::denyAsNotFound();
    }
}
