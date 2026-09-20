<?php

namespace App\Policies;

use App\Models\Ambassador;
use App\Models\Event;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class AmbassadorPolicy
{
    public function viewAny(User $user, Event $event): Response
    {
        return $this->owns($user, $event);
    }

    public function create(User $user, Event $event): Response
    {
        return $this->owns($user, $event);
    }

    public function update(User $user, Ambassador $ambassador): Response
    {
        return $this->owns($user, $ambassador->event);
    }

    public function delete(User $user, Ambassador $ambassador): Response
    {
        return $this->owns($user, $ambassador->event);
    }

    private function owns(User $user, Event $event): Response
    {
        return $event->organizer_id === $user->id ? Response::allow() : Response::denyAsNotFound();
    }
}
