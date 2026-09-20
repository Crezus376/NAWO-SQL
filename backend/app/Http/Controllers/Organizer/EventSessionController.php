<?php

namespace App\Http\Controllers\Organizer;

use App\Actions\EventSessions\CreateEventSessionAction;
use App\Actions\EventSessions\DeleteEventSessionAction;
use App\Actions\EventSessions\UpdateEventSessionAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Organizer\IndexEventSessionsRequest;
use App\Http\Requests\Organizer\StoreEventSessionRequest;
use App\Http\Requests\Organizer\UpdateEventSessionRequest;
use App\Http\Resources\EventSessionResource;
use App\Models\Event;
use App\Models\EventSession;
use Illuminate\Http\Response;

class EventSessionController extends Controller
{
    public function index(IndexEventSessionsRequest $request, Event $event)
    {
        $this->authorize('viewAny', [EventSession::class, $event]);
        $query = $event->sessions();

        return EventSessionResource::collection($request->has('page') ? $query->paginate($request->integer('per_page', 25)) : $query->get());
    }

    public function store(StoreEventSessionRequest $request, Event $event, CreateEventSessionAction $action)
    {
        $this->authorize('create', [EventSession::class, $event]);

        return (new EventSessionResource($action->execute($event, $request->validated())))->response()->setStatusCode(201);
    }

    public function update(UpdateEventSessionRequest $request, Event $event, EventSession $session, UpdateEventSessionAction $action): EventSessionResource
    {
        $this->authorize('update', $session);

        return new EventSessionResource($action->execute($session, $request->validated()));
    }

    public function destroy(Event $event, EventSession $session, DeleteEventSessionAction $action): Response
    {
        $this->authorize('delete', $session);
        $action->execute($session);

        return response()->noContent();
    }
}
