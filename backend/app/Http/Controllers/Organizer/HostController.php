<?php

namespace App\Http\Controllers\Organizer;

use App\Actions\Hosts\CreateHostAction;
use App\Actions\Hosts\DeleteHostAction;
use App\Actions\Hosts\UpdateHostAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Organizer\IndexHostsRequest;
use App\Http\Requests\Organizer\StoreHostRequest;
use App\Http\Requests\Organizer\UpdateHostRequest;
use App\Http\Resources\HostResource;
use App\Models\Event;
use App\Models\Host;
use Illuminate\Http\Response;

class HostController extends Controller
{
    public function index(IndexHostsRequest $request, Event $event)
    {
        $this->authorize('viewAny', [Host::class, $event]);
        $query = $event->hosts();

        return HostResource::collection($request->has('page') ? $query->paginate($request->integer('per_page', 25)) : $query->get());
    }

    public function store(StoreHostRequest $request, Event $event, CreateHostAction $action)
    {
        $this->authorize('create', [Host::class, $event]);

        return (new HostResource($action->execute($event, $request->validated())))->response()->setStatusCode(201);
    }

    public function update(UpdateHostRequest $request, Event $event, Host $host, UpdateHostAction $action): HostResource
    {
        $this->authorize('update', $host);

        return new HostResource($action->execute($host, $request->validated()));
    }

    public function destroy(Event $event, Host $host, DeleteHostAction $action): Response
    {
        $this->authorize('delete', $host);
        $action->execute($host);

        return response()->noContent();
    }
}
