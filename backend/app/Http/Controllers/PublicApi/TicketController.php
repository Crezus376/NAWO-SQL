<?php

namespace App\Http\Controllers\PublicApi;

use App\Http\Controllers\Controller;
use App\Http\Resources\EventResource;
use App\Http\Resources\EventSessionResource;
use App\Http\Resources\TicketResource;
use App\Http\Resources\TicketTemplateResource;
use App\Http\Resources\TicketTypeResource;
use App\Models\Ticket;

class TicketController extends Controller
{
    public function show(Ticket $ticket): array
    {
        $ticket->load(['event', 'ticketType.template', 'accesses.session']);

        return ['data' => ['ticket' => (new TicketResource($ticket))->resolve(), 'event' => (new EventResource($ticket->event))->resolve(), 'ticket_type' => (new TicketTypeResource($ticket->ticketType))->resolve(), 'template' => $ticket->ticketType->template ? (new TicketTemplateResource($ticket->ticketType->template))->resolve() : null, 'sessions' => $ticket->accesses->map(fn ($access) => ['access_id' => $access->id, 'is_used' => $access->is_used, 'used_at' => $access->used_at, 'session' => $access->session ? (new EventSessionResource($access->session))->resolve() : null])->values()]];
    }
}
