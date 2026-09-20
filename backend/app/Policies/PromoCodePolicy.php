<?php

namespace App\Policies;

use App\Models\Event;
use App\Models\PromoCode;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class PromoCodePolicy
{
    public function viewAny(User $user, Event $event): Response
    {
        return $this->owns($user, $event);
    }

    public function create(User $user, Event $event): Response
    {
        return $this->owns($user, $event);
    }

    public function update(User $user, PromoCode $promoCode): Response
    {
        return $this->owns($user, $promoCode->event);
    }

    public function delete(User $user, PromoCode $promoCode): Response
    {
        return $this->owns($user, $promoCode->event);
    }

    private function owns(User $user, Event $event): Response
    {
        return $event->organizer_id === $user->id ? Response::allow() : Response::denyAsNotFound();
    }
}
