<?php

namespace App\Http\Controllers\Organizer;

use App\Actions\EventPages\SubmitEventPageBriefAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Organizer\UpdateEventPageRequest;
use App\Http\Resources\EventPageResource;
use App\Models\Event;
use App\Models\EventPage;

class EventPageController extends Controller
{
    public function show(Event $event): EventPageResource
    {
        $this->authorize('viewForEvent', [EventPage::class, $event]);

        return new EventPageResource($event->page()->firstOrFail());
    }

    public function update(UpdateEventPageRequest $request, Event $event, SubmitEventPageBriefAction $action): EventPageResource
    {
        $this->authorize('updateForEvent', [EventPage::class, $event]);

        return new EventPageResource($action->execute($event, $request->validated('brief')));
    }
}
