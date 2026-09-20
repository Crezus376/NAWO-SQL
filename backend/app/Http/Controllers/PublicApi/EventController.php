<?php

namespace App\Http\Controllers\PublicApi;

use App\Http\Controllers\Controller;
use App\Http\Requests\PublicApi\IndexEventsRequest;
use App\Http\Resources\EventPageResource;
use App\Http\Resources\EventResource;
use App\Http\Resources\EventSessionResource;
use App\Http\Resources\TicketTypeResource;
use App\Models\Event;

class EventController extends Controller
{
    public function index(IndexEventsRequest $request)
    {
        $query = Event::whereIn('status', ['published', 'ongoing'])->orderBy('event_date');
        if ($request->integer('limit')) {
            $query->limit($request->integer('limit'));
        }

        return EventResource::collection($query->get());
    }

    public function show(Event $event): array
    {
        abort_unless(in_array($event->status, ['published', 'ongoing', 'completed'], true), 404);
        $event->load(['sessions', 'page', 'ticketTypes' => fn ($query) => $query->where('is_active', true)->orderBy('price'), 'ticketTypes.sessions']);

        return ['data' => ['event' => (new EventResource($event))->resolve(), 'sessions' => EventSessionResource::collection($event->sessions)->resolve(), 'page' => $event->page?->is_active ? (new EventPageResource($event->page))->resolve() : null, 'ticket_types' => TicketTypeResource::collection($event->ticketTypes)->resolve()]];
    }
}
