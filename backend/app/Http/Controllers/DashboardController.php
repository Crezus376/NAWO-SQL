<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Order;
use App\Models\Ticket;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $ids = Event::where('organizer_id', $request->user()->id)->pluck('id');

        return ['data' => [
            'events' => $ids->count(),
            'revenue' => (float) Order::whereIn('event_id', $ids)->where('status', 'paid')->sum('amount'),
            'orders' => Order::whereIn('event_id', $ids)->where('status', 'paid')->count(),
            'tickets' => Ticket::whereIn('event_id', $ids)->count(),
            'used_tickets' => Ticket::whereIn('event_id', $ids)->where('is_used', true)->count(),
        ]];
    }
}
