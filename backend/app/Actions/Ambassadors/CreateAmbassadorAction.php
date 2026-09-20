<?php

namespace App\Actions\Ambassadors;

use App\Models\Ambassador;
use App\Models\Event;

class CreateAmbassadorAction
{
    public function execute(Event $event, array $data): Ambassador
    {
        $event->ensureWritable();

        return Ambassador::create([...$data, 'event_id' => $event->id]);
    }
}
