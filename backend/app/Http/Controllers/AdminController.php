<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventPage;
use App\Models\Order;
use App\Models\Ticket;
use App\Models\TicketTemplate;
use App\Models\Withdrawal;
use App\Notifications\WithdrawalStatusChanged;
use App\Support\ApiPresenter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    public function overview()
    {
        return ['data' => [
            'events' => Event::count(), 
            'published_events' => Event::where('status', 'published')->count(),
            'revenue' => (float) Order::where('status', 'paid')->sum('amount'),
            'orders' => Order::where('status', 'paid')->count(), 
            'tickets' => Ticket::count(),
            'used_tickets' => Ticket::where('is_used', true)->count(),
        ]];
    }

    public function events(Request $request)
    {
        return $this->collection($request, Event::with('organizer.profile')->latest());
    }

    public function pages(Request $request)
    {
        return $this->collection($request, EventPage::with('event:id,name,slug')->latest());
    }

    public function updatePage(Request $request, EventPage $page)
    {
        $data = $request->validate([
            'status' => ['sometimes', Rule::in(['pending', 'in_progress', 'ready_for_preview', 'awaiting_payment', 'paid', 'active', 'revision_requested'])],
            'preview_url' => 'nullable|url|max:255', 'price_amount' => 'nullable|numeric|min:0',
            'is_active' => 'nullable|boolean', 'content' => 'nullable|array',
        ]);
        $page->update($data);

        return ['data' => ApiPresenter::row($page->fresh())];
    }

    public function templates(Request $request)
    {
        return $this->collection($request, TicketTemplate::with(['event:id,name', 'ticketType:id,name,event_id'])->latest());
    }

    public function storeTemplate(Request $request)
    {
        $data = $request->validate([
            'event_id' => 'required|uuid|exists:events,id',
            'ticket_type_id' => ['required', 'uuid', Rule::exists('ticket_types', 'id')->where('event_id', $request->input('event_id'))],
            'image' => 'nullable|image|max:10240', 'qr_x' => 'required|integer|min:0', 'qr_y' => 'required|integer|min:0',
            'qr_width' => 'required|integer|min:20', 'qr_height' => 'required|integer|min:20', 'status' => ['nullable', Rule::in(['draft', 'active'])],
        ]);
        $existing = TicketTemplate::where('ticket_type_id', $data['ticket_type_id'])->first();
        $oldImage = $existing?->image_path;
        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('ticket-images', 'public');
        } elseif ($existing) {
            $data['image_path'] = $existing->image_path;
        }
        if (! $existing) {
            $data['status'] ??= 'draft';
        }
        unset($data['image']);
        $row = TicketTemplate::updateOrCreate(['ticket_type_id' => $data['ticket_type_id']], $data);
        if ($oldImage && isset($data['image_path']) && $oldImage !== $data['image_path']) {
            Storage::disk('public')->delete($oldImage);
        }

        return response()->json(['data' => ApiPresenter::row($row)], 201);
    }

    public function updateTemplate(Request $request, TicketTemplate $template)
    {
        $oldImage = $template->image_path;
        $data = $request->validate(['status' => ['sometimes', Rule::in(['draft', 'active'])], 'qr_x' => 'sometimes|integer|min:0', 'qr_y' => 'sometimes|integer|min:0', 'qr_width' => 'sometimes|integer|min:20', 'qr_height' => 'sometimes|integer|min:20', 'image' => 'nullable|image|max:10240']);
        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('ticket-images', 'public');
        }
        unset($data['image']);
        $template->update($data);
        if ($oldImage && isset($data['image_path']) && $oldImage !== $data['image_path']) {
            Storage::disk('public')->delete($oldImage);
        }

        return ['data' => ApiPresenter::row($template->fresh())];
    }

    public function withdrawals(Request $request)
    {
        return $this->collection($request, Withdrawal::with(['event:id,name,slug', 'organizer.profile'])->latest(), function ($row) {
            $data = ApiPresenter::row($row);
            $data['events'] = $data['event'] ?? null;
            $data['organizer'] = $data['organizer']['profile'] ?? null;

            return $data;
        });
    }

    public function processWithdrawal(Request $request, Withdrawal $withdrawal)
    {
        abort_if($withdrawal->status === 'paid', 422, 'Cette demande a déjà été payée.');
        $data = $request->validate([
            'status' => ['required', Rule::in(['pending', 'processing', 'paid', 'rejected', 'cancelled'])],
            'reference' => 'nullable|string|max:120', 'comment' => 'nullable|string|max:500', 'proof' => 'nullable|file|max:10240',
            'proof_path' => 'nullable|string|max:300',
        ]);
        $proof = $request->file('proof')?->store('withdrawal-proofs');
        $proof ??= $data['proof_path'] ?? null;
        if ($data['status'] === 'paid' && empty($data['reference']) && ! $proof && ! $withdrawal->proof_path) {
            abort(422, 'Ajoutez une référence ou une preuve de paiement.');
        }
        $withdrawal->update([
            'status' => $data['status'], 'transaction_reference' => $data['reference'] ?? $withdrawal->transaction_reference,
            'admin_comment' => $data['comment'] ?? $withdrawal->admin_comment, 'proof_path' => $proof ?? $withdrawal->proof_path,
            'processed_by' => $request->user()->id, 'processed_at' => $data['status'] === 'paid' ? now() : $withdrawal->processed_at,
        ]);
        $withdrawal->organizer->notify(new WithdrawalStatusChanged($withdrawal->fresh()));

        return ['data' => ['withdrawal' => ApiPresenter::row($withdrawal->fresh()), 'notified' => true]];
    }

    public function proof(Request $request, Withdrawal $withdrawal)
    {
        abort_unless($withdrawal->organizer_id === $request->user()->id || $request->user()->isAdmin(), 403);
        abort_unless($withdrawal->proof_path && Storage::disk('local')->exists($withdrawal->proof_path), 404);

        return Storage::disk('local')->download($withdrawal->proof_path);
    }

    private function collection(Request $request, $query, ?callable $presenter = null): array
    {
        $presenter ??= fn ($row) => ApiPresenter::row($row);
        if (! $request->has('page')) {
            return ['data' => $query->get()->map($presenter)->values()];
        }
        $paginator = $query->paginate(min(max($request->integer('per_page', 25), 1), 100));

        return ['data' => $paginator->getCollection()->map($presenter)->values(), 'meta' => [
            'current_page' => $paginator->currentPage(), 'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(), 'total' => $paginator->total(),
        ]];
    }
}
