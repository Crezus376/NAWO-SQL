<?php

namespace App\Http\Controllers\Organizer;

use App\Actions\Ambassadors\CreateAmbassadorAction;
use App\Actions\Ambassadors\DeleteAmbassadorAction;
use App\Actions\Ambassadors\UpdateAmbassadorAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Organizer\IndexAmbassadorsRequest;
use App\Http\Requests\Organizer\StoreAmbassadorRequest;
use App\Http\Requests\Organizer\UpdateAmbassadorRequest;
use App\Http\Resources\AmbassadorResource;
use App\Models\Ambassador;
use App\Models\Event;
use Illuminate\Http\Response;

class AmbassadorController extends Controller
{
    public function index(IndexAmbassadorsRequest $request, Event $event)
    {
        $this->authorize('viewAny', [Ambassador::class, $event]);
        $query = $event->ambassadors()->withCount(['orders as sales_count' => fn ($orders) => $orders->where('status', 'paid')]);

        return AmbassadorResource::collection($request->has('page') ? $query->paginate($request->integer('per_page', 25)) : $query->get());
    }

    public function store(StoreAmbassadorRequest $request, Event $event, CreateAmbassadorAction $action)
    {
        $this->authorize('create', [Ambassador::class, $event]);

        return (new AmbassadorResource($action->execute($event, $request->validated())))->response()->setStatusCode(201);
    }

    public function update(UpdateAmbassadorRequest $request, Event $event, Ambassador $ambassador, UpdateAmbassadorAction $action): AmbassadorResource
    {
        $this->authorize('update', $ambassador);

        return new AmbassadorResource($action->execute($ambassador, $request->validated()));
    }

    public function destroy(Event $event, Ambassador $ambassador, DeleteAmbassadorAction $action): Response
    {
        $this->authorize('delete', $ambassador);
        $action->execute($ambassador);

        return response()->noContent();
    }
}
