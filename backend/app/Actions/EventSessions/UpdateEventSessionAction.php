<?php

namespace App\Actions\EventSessions;

use App\Models\EventSession;

class UpdateEventSessionAction
{
    public function execute(EventSession $session, array $data): EventSession
    {
        $session->event->ensureWritable();
        $session->update($data);

        return $session->fresh();
    }
}
