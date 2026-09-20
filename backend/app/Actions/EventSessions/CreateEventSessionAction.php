<?php

namespace App\Actions\EventSessions;

use App\Models\Event;
use App\Models\EventSession;

class CreateEventSessionAction
{
    public function execute(Event $event, array $data): EventSession
    {
        $event->ensureWritable();

        return EventSession::create([...$data, 'event_id' => $event->id]);
    }
}
