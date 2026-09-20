<?php

namespace App\Policies;

use App\Models\Event;
use App\Models\Host;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class HostPolicy
{
    public function viewAny(User $user, Event $event): Response
    {
        return $this->owns($user, $event);
    }

    public function create(User $user, Event $event): Response
    {
        return $this->owns($user, $event);
    }

    public function update(User $user, Host $host): Response
    {
        return $this->owns($user, $host->event);
    }

    public function delete(User $user, Host $host): Response
    {
        return $this->owns($user, $host->event);
    }

    private function owns(User $user, Event $event): Response
    {
        return $event->organizer_id === $user->id ? Response::allow() : Response::denyAsNotFound();
    }
}
