<?php

namespace App\Actions\EventPages;

use App\Models\Event;
use App\Models\EventPage;

class SubmitEventPageBriefAction
{
    public function execute(Event $event, ?string $brief): EventPage
    {
        $event->ensureWritable();
        if ($event->page_mode !== 'custom') {
            $event->update(['page_mode' => 'custom']);
        }

        return EventPage::updateOrCreate(['event_id' => $event->id], ['mode' => 'custom', 'brief' => $brief, 'status' => 'pending', 'content' => $event->page?->content ?? []]);
    }
}
