<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexEventsRequest;
use App\Http\Resources\EventResource;
use App\Models\Event;

class EventController extends Controller
{
    public function index(IndexEventsRequest $request)
    {
        $this->authorize('administerAny', Event::class);
        $query = Event::with('organizer')->latest();

        return EventResource::collection($request->has('page') ? $query->paginate($request->integer('per_page', 25)) : $query->get());
    }

    public function show(Event $event): EventResource
    {
        $this->authorize('administer', $event);

        return new EventResource($event->load(['organizer', 'sessions', 'ticketTypes.sessions', 'page', 'ambassadors', 'hosts']));
    }
}
