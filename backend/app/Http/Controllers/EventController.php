<?php

namespace App\Http\Controllers;

use App\Models\Ambassador;
use App\Models\Event;
use App\Models\EventPage;
use App\Models\EventSession;
use App\Models\Host;
use App\Models\PromoCode;
use App\Models\TicketType;
use App\Support\ApiPresenter;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use App\Enums\EventStatus;
use App\Enums\Currency;

class EventController extends Controller
{
    public function index(Request $request)
    {
        return $this->collection($request, $request->user()->events()->latest());
    }

    public function show(Request $request, Event $event)
    {
        $this->authorizeEvent($request, $event);
        $event->load(['sessions', 'ticketTypes.sessions', 'page', 'ambassadors', 'hosts']);

        return ['data' => ApiPresenter::row($event)];
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255', 'description' => 'nullable|string|max:10000',
            'event_date' => 'required|date', 'event_time' => 'nullable|date_format:H:i', 'location' => 'required|string|max:255',
            'page_mode' => ['nullable', Rule::in(['standard', 'custom'])],
            'currency' => ['nullable', Rule::enum(Currency::class)],
            'cover' => 'nullable|image|max:5120',
        ]);
        $path = $request->file('cover')?->store('event-images', 'public');
        $slugBase = Str::slug($data['name']) ?: 'evenement';
        $slug = $slugBase;
        for ($i = 2; Event::where('slug', $slug)->exists(); $i++) {
            $slug = $slugBase.'-'.$i;
        }
        $event = Event::create([
            ...collect($data)->except('cover')->all(), 'organizer_id' => $request->user()->id,
            'slug' => $slug, 'cover_image_path' => $path, 'status' => 'draft',
            'currency' => $data['currency'] ?? Currency::XOF->value,
        ]);

        return response()->json(['data' => ApiPresenter::row($event)], 201);
    }

    public function update(Request $request, Event $event)
    {
        $this->authorizeEvent($request, $event);
        $event->ensureWritable();
        $oldCover = $event->cover_image_path;
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255', 'description' => 'nullable|string|max:10000',
            'event_date' => 'sometimes|required|date', 'event_time' => 'nullable|date_format:H:i', 'location' => 'sometimes|required|string|max:255',
            'status' => ['sometimes', Rule::enum(EventStatus::class)],
            'page_mode' => ['sometimes', Rule::in(['standard', 'custom'])],
            'currency' => ['sometimes', 'nullable', Rule::enum(Currency::class)],
            'cover' => 'nullable|image|max:5120', 'brief' => 'nullable|string|max:10000',
        ]);
        if ($request->hasFile('cover')) {
            $data['cover_image_path'] = $request->file('cover')->store('event-images', 'public');
        }
        unset($data['cover']);
        $brief = $data['brief'] ?? null;
        unset($data['brief']);
        if (array_key_exists('currency', $data) && $data['currency'] === null) {
            $data['currency'] = Currency::XOF->value;
        }
        $event->update($data);
        if (isset($data['cover_image_path']) && $oldCover && $oldCover !== $data['cover_image_path']) {
            Storage::disk('public')->delete($oldCover);
        }
        if ($event->page_mode === 'custom' || $brief !== null) {
            EventPage::updateOrCreate(['event_id' => $event->id], ['mode' => 'custom', 'brief' => $brief, 'status' => 'pending']);
        }

        return ['data' => ApiPresenter::row($event->fresh())];
    }

    public function destroy(Request $request, Event $event)
    {
        $this->authorizeEvent($request, $event);
        $event->ensureWritable();
        $publicFiles = collect([$event->cover_image_path])
            ->merge($event->ticketTypes()->pluck('image_path'))
            ->merge($event->ticketTypes()->with('template')->get()->pluck('template.image_path'))
            ->filter()->all();
        $event->delete();
        Storage::disk('public')->delete($publicFiles);

        return response()->noContent();
    }

    public function overview(Request $request, Event $event)
    {
        $this->authorizeEvent($request, $event);

        return ['data' => [
            'orders' => $event->orders()->where('status', 'paid')->count(),
            'revenue' => (float) $event->orders()->where('status', 'paid')->sum('amount'),
            'tickets' => $event->tickets()->count(), 'used_tickets' => $event->tickets()->where('is_used', true)->count(),
            'valid_scans' => $event->scans()->where('result', 'valid')->count(),
        ]];
    }

    public function listResource(Request $request, Event $event, string $resource)
    {
        $this->authorizeEvent($request, $event);
        $relation = $this->relation($resource);
        $query = $event->{$relation}();
        if ($resource === 'ticket-types') {
            $query->with('sessions');
        }

        return $this->collection($request, $query);
    }

    public function createResource(Request $request, Event $event, string $resource)
    {
        $this->authorizeEvent($request, $event);
        $event->ensureWritable();
        [$class, $data] = $this->resourceData($request, $resource, $event);
        $sessions = $data['session_ids'] ?? [];
        unset($data['session_ids']);
        $row = DB::transaction(function () use ($class, $data, $sessions) {
            $row = $class::create($data);
            if ($row instanceof TicketType) {
                $row->sessions()->sync($sessions);
            }

            return $row;
        });

        return response()->json(['data' => ApiPresenter::row($row->fresh())], 201);
    }

    public function updateResource(Request $request, Event $event, string $resource, string $id)
    {
        $this->authorizeEvent($request, $event);
        $event->ensureWritable();
        [$class, $data] = $this->resourceData($request, $resource, $event, true);
        /** @var Model $row */
        $row = $class::where('event_id', $event->id)->findOrFail($id);
        $oldImage = $row instanceof TicketType ? $row->image_path : null;
        $sessions = $data['session_ids'] ?? null;
        unset($data['session_ids']);
        DB::transaction(function () use ($row, $data, $sessions) {
            $row->update($data);
            if ($row instanceof TicketType && $sessions !== null) {
                $row->sessions()->sync($sessions);
            }
        });
        if ($oldImage && isset($data['image_path']) && $oldImage !== $data['image_path']) {
            Storage::disk('public')->delete($oldImage);
        }

        return ['data' => ApiPresenter::row($row->fresh())];
    }

    public function deleteResource(Request $request, Event $event, string $resource, string $id)
    {
        $this->authorizeEvent($request, $event);
        $event->ensureWritable();
        $class = $this->resourceClass($resource);
        $row = $class::where('event_id', $event->id)->findOrFail($id);
        $files = $row instanceof TicketType
            ? collect([$row->image_path, $row->template?->image_path])->filter()->all()
            : [];
        $row->delete();
        Storage::disk('public')->delete($files);

        return response()->noContent();
    }

    private function resourceData(Request $request, string $resource, Event $event, bool $partial = false): array
    {
        $sometimes = $partial ? 'sometimes|' : '';
        $rules = match ($resource) {
            'sessions' => ['name' => $sometimes.'required|string|max:255', 'session_date' => $sometimes.'required|date', 'start_time' => 'nullable|date_format:H:i', 'end_time' => 'nullable|date_format:H:i', 'location' => 'nullable|string|max:255', 'sort_order' => 'nullable|integer|min:0'],
            'ticket-types' => ['name' => $sometimes.'required|string|max:255', 'price' => $sometimes.'required|numeric|min:0', 'quantity' => $sometimes.'required|integer|min:0', 'description' => 'nullable|string|max:5000', 'is_active' => 'nullable|boolean', 'image' => 'nullable|image|max:5120', 'session_ids' => 'nullable|array', 'session_ids.*' => ['uuid', Rule::exists('event_sessions', 'id')->where('event_id', $event->id)]],
            'promo-codes' => ['code' => $sometimes.'required|string|max:40', 'discount_type' => [$partial ? 'sometimes' : 'required', Rule::in(['percent', 'amount'])], 'discount_value' => $sometimes.'required|numeric|min:0', 'usage_limit' => 'nullable|integer|min:1', 'starts_at' => 'nullable|date', 'ends_at' => 'nullable|date|after_or_equal:starts_at', 'is_active' => 'nullable|boolean'],
            'ambassadors' => ['name' => $sometimes.'required|string|max:255', 'ref_code' => $sometimes.'required|string|max:60', 'sales_goal' => 'nullable|integer|min:0'],
            'hosts' => ['name' => $sometimes.'required|string|max:255', 'access_code' => 'nullable|string|max:40', 'is_active' => 'nullable|boolean'],
            default => abort(404),
        };
        $data = $request->validate($rules);
        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('ticket-images', 'public');
        }
        unset($data['image']);
        $data['event_id'] = $event->id;
        if ($resource === 'promo-codes' && isset($data['code'])) {
            $data['code'] = strtoupper(trim($data['code']));
        }
        if ($resource === 'hosts' && ! $partial && empty($data['access_code'])) {
            $data['access_code'] = strtoupper(Str::random(8));
        }

        return [$this->resourceClass($resource), $data];
    }

    private function relation(string $resource): string
    {
        return match ($resource) {
            'sessions' => 'sessions', 'ticket-types' => 'ticketTypes', 'promo-codes' => 'promoCodes', 'ambassadors' => 'ambassadors', 'hosts' => 'hosts', default => abort(404)
        };
    }

    private function resourceClass(string $resource): string
    {
        return match ($resource) {
            'sessions' => EventSession::class, 'ticket-types' => TicketType::class, 'promo-codes' => PromoCode::class, 'ambassadors' => Ambassador::class, 'hosts' => Host::class, default => abort(404)
        };
    }

    private function authorizeEvent(Request $request, Event $event): void
    {
        abort_unless($event->organizer_id === $request->user()->id || $request->user()->isAdmin(), 403);
    }

    private function collection(Request $request, $query): array
    {
        if (! $request->has('page')) {
            return ['data' => $query->get()->map(fn ($row) => ApiPresenter::row($row))->values()];
        }
        $paginator = $query->paginate(min(max($request->integer('per_page', 25), 1), 100));

        return ['data' => $paginator->getCollection()->map(fn ($row) => ApiPresenter::row($row))->values(), 'meta' => [
            'current_page' => $paginator->currentPage(), 'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(), 'total' => $paginator->total(),
        ]];
    }
}
