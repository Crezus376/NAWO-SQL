<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Ticket;
use App\Services\PurchaseService;
use App\Support\ApiPresenter;
use Illuminate\Http\Request;

class PublicController extends Controller
{
    public function events(Request $request)
    {
        $query = Event::whereIn('status', ['published', 'ongoing'])->orderBy('event_date');
        if ($request->integer('limit')) {
            $query->limit(min($request->integer('limit'), 50));
        }

        return ['data' => $query->get()->map(fn ($e) => ApiPresenter::row($e))->values()];
    }

    public function event(string $slug)
    {
        $event = Event::where('slug', $slug)->whereIn('status', ['published', 'ongoing', 'completed'])
            ->with(['sessions', 'page', 'ticketTypes' => fn ($q) => $q->where('is_active', true)->orderBy('price'), 'ticketTypes.sessions'])->firstOrFail();

        return ['data' => [
            'event' => ApiPresenter::row($event),
            'sessions' => $event->sessions->map(fn ($x) => ApiPresenter::row($x))->values(),
            'page' => $event->page && $event->page->is_active ? ApiPresenter::row($event->page) : null,
            'ticket_types' => $event->ticketTypes->map(function ($type) {
                $row = ApiPresenter::row($type);
                $row['sessions'] = $type->sessions->map(fn ($s) => ApiPresenter::row($s))->values();

                return $row;
            })->values(),
        ]];
    }

    public function purchase(Request $request, string $slug, PurchaseService $service)
    {
        $data = $request->validate([
            'ticket_type_id' => 'required|uuid', 'idempotency_key' => 'required|uuid',
            'first_name' => 'required|string|max:80', 'last_name' => 'required|string|max:80', 'email' => ['required', 'string', 'email', 'not_regex:/[\r\n]/'],
            'phone' => 'nullable|string|max:40', 'promo_code' => 'nullable|string|max:40', 'ref' => 'nullable|string|max:60',
        ]);
        $data['slug'] = $slug;

        return response()->json(['data' => $service->create($data)], 201);
    }

    public function ticket(string $id)
    {
        $ticket = Ticket::with(['event', 'ticketType.template', 'accesses.session'])->findOrFail($id);

        return ['data' => [
            'ticket' => ApiPresenter::row($ticket), 'event' => ApiPresenter::row($ticket->event),
            'ticketType' => ApiPresenter::row($ticket->ticketType),
            'template' => $ticket->ticketType->template ? ApiPresenter::row($ticket->ticketType->template) : null,
            'sessions' => $ticket->accesses->map(fn ($a) => ['accessId' => $a->id, 'isUsed' => $a->is_used, 'usedAt' => $a->used_at, 'session' => ApiPresenter::row($a->session)])->values(),
        ]];
    }
}
