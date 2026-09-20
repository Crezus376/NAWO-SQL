<?php

namespace App\Http\Controllers\Organizer;

use App\Actions\Events\CreateEventAction;
use App\Actions\Events\DeleteEventAction;
use App\Actions\Events\UpdateEventAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Organizer\IndexEventsRequest;
use App\Http\Requests\Organizer\StoreEventRequest;
use App\Http\Requests\Organizer\UpdateEventRequest;
use App\Http\Resources\EventResource;
use App\Models\Event;
use Illuminate\Http\Response;

class EventController extends Controller
{
    public function index(IndexEventsRequest $request)
    {
        $query = $request->user()->events()->latest();

        return EventResource::collection($request->has('page') ? $query->paginate($request->integer('per_page', 25)) : $query->get());
    }

    public function store(StoreEventRequest $request, CreateEventAction $action)
    {
        $this->authorize('create', Event::class);
        $data = $request->validated();
        unset($data['cover']);

        return (new EventResource($action->execute($request->user(), $data, $request->file('cover'))))->response()->setStatusCode(201);
    }

    public function show(Event $event): EventResource
    {
        $this->authorize('view', $event);

        return new EventResource($event->load(['sessions', 'ticketTypes.sessions', 'page', 'ambassadors', 'hosts']));
    }

    public function update(UpdateEventRequest $request, Event $event, UpdateEventAction $action): EventResource
    {
        $this->authorize('update', $event);
        $data = $request->validated();
        unset($data['cover']);

        return new EventResource($action->execute($event, $data, $request->file('cover')));
    }

    public function destroy(Event $event, DeleteEventAction $action): Response
    {
        $this->authorize('delete', $event);
        $action->execute($event);

        return response()->noContent();
    }
}
