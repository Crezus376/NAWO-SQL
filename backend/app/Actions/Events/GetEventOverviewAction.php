<?php

namespace App\Actions\Events;

use App\Http\Resources\OrderResource;
use App\Models\Event;

class GetEventOverviewAction
{
    public function execute(Event $event): array
    {
        return [
            'orders' => OrderResource::collection($event->orders()->where('status', 'paid')->latest()->limit(15)->get())->resolve(),
            'orders_count' => $event->orders()->where('status', 'paid')->count(),
            'revenue' => (float) $event->orders()->where('status', 'paid')->sum('amount'),
            'tickets_count' => $event->tickets()->count(),
            'used_tickets' => $event->tickets()->where('is_used', true)->count(),
            'valid_scans' => $event->scans()->where('result', 'valid')->count(),
        ];
    }
}
