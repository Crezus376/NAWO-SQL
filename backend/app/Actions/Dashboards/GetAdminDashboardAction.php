<?php

namespace App\Actions\Dashboards;

use App\Models\Event;
use App\Models\Order;
use App\Models\Ticket;

class GetAdminDashboardAction
{
    public function execute(): array
    {
        return [
            'events' => Event::count(),
            'published_events' => Event::where('status', 'published')->count(),
            'revenue' => (float) Order::where('status', 'paid')->sum('amount'),
            'orders' => Order::where('status', 'paid')->count(),
            'tickets' => Ticket::count(),
            'used_tickets' => Ticket::where('is_used', true)->count(),
        ];
    }
}
