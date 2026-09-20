<?php

namespace App\Http\Controllers\Organizer;

use App\Actions\TicketTypes\CreateTicketTypeAction;
use App\Actions\TicketTypes\DeleteTicketTypeAction;
use App\Actions\TicketTypes\UpdateTicketTypeAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Organizer\IndexTicketTypesRequest;
use App\Http\Requests\Organizer\StoreTicketTypeRequest;
use App\Http\Requests\Organizer\UpdateTicketTypeRequest;
use App\Http\Resources\TicketTypeResource;
use App\Models\Event;
use App\Models\TicketType;
use Illuminate\Http\Response;

class TicketTypeController extends Controller
{
    public function index(IndexTicketTypesRequest $request, Event $event)
    {
        $this->authorize('viewAny', [TicketType::class, $event]);
        $query = $event->ticketTypes()->with('sessions');

        return TicketTypeResource::collection($request->has('page') ? $query->paginate($request->integer('per_page', 25)) : $query->get());
    }

    public function store(StoreTicketTypeRequest $request, Event $event, CreateTicketTypeAction $action)
    {
        $this->authorize('create', [TicketType::class, $event]);
        $data = $request->validated();
        unset($data['image']);

        return (new TicketTypeResource($action->execute($event, $data, $request->file('image'))))->response()->setStatusCode(201);
    }

    public function update(UpdateTicketTypeRequest $request, Event $event, TicketType $ticketType, UpdateTicketTypeAction $action): TicketTypeResource
    {
        $this->authorize('update', $ticketType);
        $data = $request->validated();
        unset($data['image']);

        return new TicketTypeResource($action->execute($ticketType, $data, $request->file('image')));
    }

    public function destroy(Event $event, TicketType $ticketType, DeleteTicketTypeAction $action): Response
    {
        $this->authorize('delete', $ticketType);
        $action->execute($ticketType);

        return response()->noContent();
    }
}
