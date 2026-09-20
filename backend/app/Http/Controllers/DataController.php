<?php

namespace App\Http\Controllers;

use App\Enums\EventStatus;
use App\Enums\Currency;
use App\Enums\UserRole as UserRoleEnum;
use App\Models\Ambassador;
use App\Models\Event;
use App\Models\EventPage;
use App\Models\EventSession;
use App\Models\Host;
use App\Models\Order;
use App\Models\PromoCode;
use App\Models\Scan;
use App\Models\Ticket;
use App\Models\TicketTemplate;
use App\Models\TicketType;
use App\Models\TicketTypeSession;
use App\Models\UserRole;
use App\Support\ApiPresenter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

/**
 * Transitional query endpoint for the preserved frontend. It is deliberately
 * allow-listed and applies ownership rules server-side; it is not a raw SQL API.
 */
class DataController extends Controller
{
    private const MODELS = [
        'events' => Event::class, 'event_pages' => EventPage::class, 'event_sessions' => EventSession::class,
        'ticket_types' => TicketType::class, 'ticket_type_sessions' => TicketTypeSession::class,
        'ticket_templates' => TicketTemplate::class, 'promo_codes' => PromoCode::class,
        'ambassadors' => Ambassador::class, 'hosts' => Host::class, 'orders' => Order::class,
        'tickets' => Ticket::class, 'scans' => Scan::class, 'user_roles' => UserRole::class,
    ];

    private const PUBLIC_READ = ['events', 'event_pages', 'event_sessions', 'ticket_types'];

    private const MUTABLE = ['events', 'event_pages', 'event_sessions', 'ticket_types', 'ticket_type_sessions', 'ticket_templates', 'promo_codes', 'ambassadors', 'hosts'];

    private const ORGANIZER_FIELDS = [
        'events' => ['name', 'description', 'event_date', 'event_time', 'location', 'cover_image_path', 'status', 'page_mode', 'currency'],
        'event_pages' => ['brief'],
        'event_sessions' => ['name', 'session_date', 'start_time', 'end_time', 'location', 'sort_order'],
        'ticket_types' => ['name', 'price', 'quantity', 'description', 'image_path', 'is_active'],
        'ticket_type_sessions' => ['ticket_type_id', 'session_id'],
        'promo_codes' => ['code', 'discount_type', 'discount_value', 'usage_limit', 'starts_at', 'ends_at', 'is_active'],
        'ambassadors' => ['name', 'ref_code', 'sales_goal'],
        'hosts' => ['name', 'access_code', 'is_active'],
    ];

    public function index(Request $request, string $table)
    {
        $model = $this->model($table);
        abort_unless($request->user() || in_array($table, self::PUBLIC_READ, true), 401);
        $query = $model::query();
        $this->scope($query, $request, $table);
        $this->filters($query, $request, $model);
        if ($order = $request->query('order')) {
            [$column, $direction] = array_pad(explode(':', $order, 2), 2, 'asc');
            if (Schema::hasColumn($model->getTable(), $column)) {
                $query->orderBy($column, $direction === 'desc' ? 'desc' : 'asc');
            }
        }
        if ($request->integer('limit')) {
            $query->limit(min($request->integer('limit'), 500));
        }
        $this->relations($query, $table);
        if ($request->has('page')) {
            $paginator = $query->paginate(min(max($request->integer('per_page', 25), 1), 100));

            return ['data' => $paginator->getCollection()->map(fn ($row) => $this->present($row, $table))->values(), 'meta' => [
                'current_page' => $paginator->currentPage(), 'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(), 'total' => $paginator->total(),
            ]];
        }
        $rows = $query->get()->map(fn ($row) => $this->present($row, $table))->values();
        if ($request->boolean('single')) {
            return ['data' => $rows->first()];
        }

        return ['data' => $rows];
    }

    public function store(Request $request, string $table)
    {
        $this->requireUser($request);
        $this->authorizeMutation($request, $table);
        $class = $this->model($table);
        $payload = $request->isJson() ? $request->json()->all() : $request->request->all();
        $items = array_is_list($payload) ? $payload : [$payload];
        $created = collect();
        foreach ($items as $attributes) {
            $attributes = $this->normalize($attributes, $table);
            if ($table === 'events' && (! array_key_exists('currency', $attributes) || $attributes['currency'] === null)) {
                $attributes['currency'] = Currency::XOF->value;
            }
            $this->validateEventAttributes($attributes, $table, true);
            $this->validateRoleAttributes($attributes, $table, true);
            $this->authorizeAttributes($request, $table, $attributes);
            $attributes = $this->allowedAttributes($request, $table, $attributes, true);
            $created->push($class::create($attributes)->refresh());
        }
        $rows = $created->map(fn ($row) => $this->present($row, $table))->values();

        return response()->json(['data' => $request->boolean('single') ? $rows->first() : $rows], 201);
    }

    public function update(Request $request, string $table)
    {
        $this->requireUser($request);
        $this->authorizeMutation($request, $table);
        $model = $this->model($table);
        $query = $model::query();
        $this->scope($query, $request, $table);
        $this->filters($query, $request, $model);
        $rows = $query->get();
        $attributes = $this->normalize($request->input('values', []), $table);
        if ($table === 'events' && array_key_exists('currency', $attributes) && $attributes['currency'] === null) {
            $attributes['currency'] = Currency::XOF->value;
        }
        $this->ensureWritableRows($rows, $table);
        $this->validateEventAttributes($attributes, $table, false);
        $this->validateRoleAttributes($attributes, $table, false);
        $attributes = $this->allowedAttributes($request, $table, $attributes, false);
        foreach ($rows as $row) {
            $row->update($attributes);
        }
        $data = $rows->map(fn ($row) => $this->present($row->fresh(), $table))->values();

        return ['data' => $request->boolean('single') ? $data->first() : $data];
    }

    public function destroy(Request $request, string $table)
    {
        $this->requireUser($request);
        $this->authorizeMutation($request, $table);
        $model = $this->model($table);
        $query = $model::query();
        $this->scope($query, $request, $table);
        $this->filters($query, $request, $model);
        $this->ensureWritableRows($query->get(), $table);
        $query->delete();

        return response()->noContent();
    }

    public function upload(Request $request, string $bucket)
    {
        $this->requireUser($request);
        abort_unless(in_array($bucket, ['event-images', 'ticket-images', 'withdrawal-proofs'], true), 404);
        if ($bucket === 'withdrawal-proofs') {
            abort_unless($request->user()->isAdmin(), 403);
        }
        $request->validate(['file' => $bucket === 'withdrawal-proofs' ? 'required|file|max:10240' : 'required|image|max:10240']);
        $disk = $bucket === 'withdrawal-proofs' ? 'local' : 'public';
        $path = $request->file('file')->store($bucket, $disk);

        return ['data' => ['path' => $path, 'url' => $disk === 'public' ? url('/storage/'.$path) : null]];
    }

    private function scope(Builder $query, Request $request, string $table): void
    {
        $user = $request->user();
        if (! $user) {
            if ($table === 'events') {
                $query->whereIn('status', ['published', 'ongoing']);
            } else {
                $query->whereHas('event', fn ($q) => $q->whereIn('status', ['published', 'ongoing']));
                if ($table === 'event_pages') {
                    $query->where('is_active', true);
                }
                if ($table === 'ticket_types') {
                    $query->where('is_active', true);
                }
            }

            return;
        }
        if ($user->isAdmin()) {
            return;
        }
        if ($table === 'events') {
            $query->where('organizer_id', $user->id);
        } elseif ($table === 'user_roles') {
            $query->where('user_id', $user->id);
        } elseif (in_array($table, ['event_pages', 'event_sessions', 'ticket_types', 'ticket_templates', 'promo_codes', 'ambassadors', 'hosts', 'orders', 'tickets', 'scans'], true)) {
            $query->whereHas('event', fn ($q) => $q->where('organizer_id', $user->id));
        } elseif ($table === 'ticket_type_sessions') {
            $query->whereHas('ticketType.event', fn ($q) => $q->where('organizer_id', $user->id));
        }
    }

    private function filters(Builder $query, Request $request, Model $model): void
    {
        foreach ((array) $request->query('eq', []) as $column => $value) {
            if (Schema::hasColumn($model->getTable(), $column)) {
                $query->where($column, $value);
            }
        }
        foreach ((array) $request->query('in', []) as $column => $value) {
            if (Schema::hasColumn($model->getTable(), $column)) {
                $query->whereIn($column, explode(',', $value));
            }
        }
        foreach ((array) $request->query('ilike', []) as $column => $value) {
            if (Schema::hasColumn($model->getTable(), $column)) {
                $query->whereRaw('LOWER('.$column.') LIKE ?', [strtolower($value)]);
            }
        }
    }

    private function relations(Builder $query, string $table): void
    {
        match ($table) {
            'event_pages' => $query->with('event:id,name,slug'),
            'ticket_types' => $query->with(['event:id,name', 'sessions:id,name,session_date,start_time']),
            'ticket_templates' => $query->with(['event:id,name', 'ticketType:id,name,event_id']),
            default => null,
        };
    }

    private function present(Model $row, string $table): array
    {
        $data = ApiPresenter::row($row);
        if (isset($data['event'])) {
            $data['events'] = $data['event'];
        }
        if (isset($data['ticket_type'])) {
            $data['ticket_types'] = $data['ticket_type'];
        }
        if ($table === 'ticket_types' && isset($data['sessions'])) {
            $data['ticket_type_sessions'] = collect($data['sessions'])->map(fn ($session) => ['session_id' => $session['id'], 'event_sessions' => $session])->values()->all();
        }

        return $data;
    }

    private function normalize(array $attributes, string $table): array
    {
        unset($attributes['id'], $attributes['created_at'], $attributes['updated_at'], $attributes['events'], $attributes['ticket_types'], $attributes['ticket_type_sessions'], $attributes['sessions']);
        foreach (['cover_image_url' => 'cover_image_path', 'image_url' => 'image_path'] as $url => $path) {
            if (array_key_exists($url, $attributes)) {
                $attributes[$path] = $attributes[$url] ? preg_replace('#^.*/storage/#', '', $attributes[$url]) : null;
                unset($attributes[$url]);
            }
        }
        if ($table === 'events') {
            unset($attributes['organizer_id'], $attributes['slug']);
        }

        return $attributes;
    }

    private function authorizeAttributes(Request $request, string $table, array &$attributes): void
    {
        $user = $request->user();
        if ($table === 'events') {
            $attributes['organizer_id'] = $user->id;
            $base = Str::slug($attributes['name'] ?? 'evenement') ?: 'evenement';
            $slug = $base;
            for ($i = 2; Event::where('slug', $slug)->exists(); $i++) {
                $slug = $base.'-'.$i;
            }
            $attributes['slug'] = $slug;
        }
        if ($table === 'user_roles') {
            abort_unless($user->isAdmin(), 403);
        }
        $eventId = $attributes['event_id'] ?? null;
        if ($eventId) {
            $event = Event::find($eventId);
            abort_unless($event && ($user->isAdmin() || $event->organizer_id === $user->id), 403);
            $event->ensureWritable();
        }
        if ($table === 'ticket_type_sessions') {
            $ticketType = TicketType::whereKey($attributes['ticket_type_id'] ?? null)->first();
            $session = EventSession::whereKey($attributes['session_id'] ?? null)->first();
            abort_unless($ticketType && $session && $ticketType->event_id === $session->event_id, 422);
            abort_unless($user->isAdmin() || $ticketType->event()->where('organizer_id', $user->id)->exists(), 403);
            $ticketType->event->ensureWritable();
        }
    }

    private function validateRoleAttributes(array $attributes, string $table, bool $creating): void
    {
        if ($table !== 'user_roles') {
            return;
        }

        Validator::make($attributes, [
            'role' => [$creating ? 'required' : 'sometimes', Rule::enum(UserRoleEnum::class)],
        ])->validate();
    }

    private function validateEventAttributes(array $attributes, string $table, bool $creating): void
    {
        if ($table !== 'events') {
            return;
        }

        $rules = [
            'name' => [$creating ? 'required' : 'sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:10000'],
            'event_date' => [$creating ? 'required' : 'sometimes', 'required', 'date'],
            'event_time' => ['nullable', 'date_format:H:i'],
            'location' => [$creating ? 'required' : 'sometimes', 'required', 'string', 'max:255'],
            'page_mode' => ['nullable', Rule::in(['standard', 'custom'])],
            'currency' => [$creating ? 'required' : 'sometimes', Rule::enum(Currency::class)],
        ];
        if (array_key_exists('status', $attributes)) {
            $rules['status'] = [$creating ? 'required' : 'sometimes', Rule::enum(EventStatus::class)];
        }

        Validator::make($attributes, $rules)->validate();
    }

    private function ensureWritableRows($rows, string $table): void
    {
        foreach ($rows as $row) {
            $event = $table === 'events'
                ? $row
                : ($table === 'ticket_type_sessions' ? $row->ticketType?->event : $row->event);

            $event?->ensureWritable();
        }
    }

    private function authorizeMutation(Request $request, string $table): void
    {
        abort_unless(in_array($table, self::MUTABLE, true), 405);
        if (in_array($table, ['ticket_templates', 'user_roles'], true)) {
            abort_unless($request->user()->isAdmin(), 403);
        }
    }

    private function allowedAttributes(Request $request, string $table, array $attributes, bool $creating): array
    {
        if ($request->user()->isAdmin()) {
            return $attributes;
        }
        $allowed = self::ORGANIZER_FIELDS[$table] ?? [];
        if ($creating && $table === 'events') {
            $allowed = [...$allowed, 'organizer_id', 'slug'];
        }
        if ($creating && in_array($table, ['event_pages', 'event_sessions', 'ticket_types', 'promo_codes', 'ambassadors', 'hosts'], true)) {
            $allowed[] = 'event_id';
        }
        if ($table === 'event_pages' && $creating) {
            $attributes['mode'] = 'custom';
            $attributes['status'] = 'pending';
            $allowed = [...$allowed, 'mode', 'status'];
        }

        return collect($attributes)->only($allowed)->all();
    }

    private function requireUser(Request $request): void
    {
        abort_unless($request->user(), 401);
    }

    private function model(string $table): Model
    {
        abort_unless(isset(self::MODELS[$table]), 404);

        return new (self::MODELS[$table]);
    }
}
