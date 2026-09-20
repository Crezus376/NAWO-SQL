<?php

namespace App\Http\Controllers\Organizer;

use App\Actions\Events\GetEventOverviewAction;
use App\Http\Controllers\Controller;
use App\Models\Event;

class EventOverviewController extends Controller
{
    public function show(Event $event, GetEventOverviewAction $action): array
    {
        $this->authorize('view', $event);

        return ['data' => $action->execute($event)];
    }
}
