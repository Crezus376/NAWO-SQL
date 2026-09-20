<?php

namespace App\Http\Controllers\Admin;

use App\Actions\EventPages\UpdateEventPageAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexEventPagesRequest;
use App\Http\Requests\Admin\UpdateEventPageRequest;
use App\Http\Resources\EventPageResource;
use App\Models\EventPage;

class EventPageController extends Controller
{
    public function index(IndexEventPagesRequest $request)
    {
        $this->authorize('administerAny', EventPage::class);
        $query = EventPage::with('event')->latest();

        return EventPageResource::collection($request->has('page') ? $query->paginate($request->integer('per_page', 25)) : $query->get());
    }

    public function update(UpdateEventPageRequest $request, EventPage $eventPage, UpdateEventPageAction $action): EventPageResource
    {
        $this->authorize('administer', $eventPage);

        return new EventPageResource($action->execute($eventPage, $request->validated()));
    }
}
