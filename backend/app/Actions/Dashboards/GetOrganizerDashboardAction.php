<?php

namespace App\Actions\Dashboards;

use App\Models\Event;
use App\Models\Order;
use App\Models\Ticket;

class GetOrganizerDashboardAction
{
    public function execute(string $organizerId): array
    {
        $eventIds = Event::where('organizer_id', $organizerId)->pluck('id');

        return [
            'events' => $eventIds->count(),
            'revenue' => (float) Order::whereIn('event_id', $eventIds)->where('status', 'paid')->sum('amount'),
            'orders' => Order::whereIn('event_id', $eventIds)->where('status', 'paid')->count(),
            'tickets' => Ticket::whereIn('event_id', $eventIds)->count(),
            'used_tickets' => Ticket::whereIn('event_id', $eventIds)->where('is_used', true)->count(),
        ];
    }
}
