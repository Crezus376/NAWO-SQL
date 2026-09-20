<?php

namespace App\Actions\EventSessions;

use App\Models\EventSession;

class DeleteEventSessionAction
{
    public function execute(EventSession $session): void
    {
        $session->event->ensureWritable();
        $session->delete();
    }
}
