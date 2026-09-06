<?php

namespace App\Services;

use App\Models\Ambassador;
use App\Models\Event;
use App\Models\EventSession;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PromoCode;
use App\Models\Ticket;
use App\Models\TicketSessionAccess;
use App\Models\TicketType;
use App\Notifications\TicketPurchased;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use RuntimeException;

class PurchaseService
{
    public function create(array $input): array
    {
        try {
            $result = DB::transaction(function () use ($input) {
                $existing = Order::with(['ticket', 'payment'])->where('idempotency_key', $input['idempotency_key'])->first();
                if ($existing) {
                    return $this->result($existing, false);
                }

                $event = Event::where('slug', $input['slug'])->whereIn('status', ['published', 'ongoing'])->first();
                if (! $event) {
                    throw new RuntimeException("Cet événement n'est pas disponible à la vente.");
                }

                $type = TicketType::whereKey($input['ticket_type_id'])->where('event_id', $event->id)->lockForUpdate()->first();
                if (! $type || ! $type->is_active) {
                    throw new RuntimeException('Type de billet introuvable.');
                }
                if ($type->quantity > 0 && $type->sold >= $type->quantity) {
                    throw new RuntimeException('Ce type de billet est épuisé.');
                }

                $promo = null;
                if (! empty($input['promo_code'])) {
                    $promo = PromoCode::where('event_id', $event->id)
                        ->whereRaw('LOWER(code) = ?', [strtolower(trim($input['promo_code']))])
                        ->where('is_active', true)->lockForUpdate()->first();
                    if ($promo && (($promo->starts_at && $promo->starts_at->isFuture()) || ($promo->ends_at && $promo->ends_at->isPast()) || ($promo->usage_limit !== null && $promo->used_count >= $promo->usage_limit))) {
                        $promo = null;
                    }
                }

                $price = (float) $type->price;
                $discount = ! $promo ? 0 : ($promo->discount_type === 'percent'
                    ? round($price * ((float) $promo->discount_value / 100))
                    : min((float) $promo->discount_value, $price));
                $amount = max($price - $discount, 0);
                $ambassador = empty($input['ref']) ? null : Ambassador::where('event_id', $event->id)->whereRaw('LOWER(ref_code) = ?', [strtolower($input['ref'])])->first();

                $order = Order::create([
                    'event_id' => $event->id, 'ticket_type_id' => $type->id, 'ambassador_id' => $ambassador?->id,
                    'promo_code_id' => $promo?->id, 'idempotency_key' => $input['idempotency_key'],
                    'first_name' => $input['first_name'], 'last_name' => $input['last_name'], 'email' => $input['email'],
                    'phone' => $input['phone'] ?? null, 'amount' => $amount, 'discount' => $discount, 'status' => 'paid',
                ]);
                $payment = Payment::create(['order_id' => $order->id, 'provider' => 'manual', 'amount' => $amount, 'status' => 'paid']);
                $ticket = Ticket::create([
                    'order_id' => $order->id, 'event_id' => $event->id, 'ticket_type_id' => $type->id,
                    'ticket_number' => 'NAWO-'.strtoupper(base_convert((string) time(), 10, 36)).'-'.strtoupper(Str::random(8)),
                    'qr_token' => (string) Str::uuid().'.'.Str::random(32),
                    'holder_first_name' => $input['first_name'], 'holder_last_name' => $input['last_name'],
                ]);
                $sessionIds = $type->sessions()->pluck('event_sessions.id');
                if ($sessionIds->isEmpty()) {
                    $sessionIds = EventSession::where('event_id', $event->id)->pluck('id');
                }
                foreach ($sessionIds as $sessionId) {
                    TicketSessionAccess::create(['ticket_id' => $ticket->id, 'session_id' => $sessionId]);
                }
                $type->increment('sold');
                if ($promo) {
                    $promo->increment('used_count');
                }
                $order->setRelation('ticket', $ticket)->setRelation('payment', $payment);

                return $this->result($order, true);
            }, 5);
            if ($result['notify']) {
                $order = Order::with(['ticket', 'event'])->findOrFail($result['orderId']);
                Notification::route('mail', $order->email)->notify(new TicketPurchased($order));
            }
            unset($result['notify']);

            return $result;
        } catch (QueryException $e) {
            $existing = Order::with(['ticket', 'payment'])->where('idempotency_key', $input['idempotency_key'])->first();
            if ($existing) {
                return $this->result($existing, false);
            }
            throw $e;
        }
    }

    private function result(Order $order, bool $notify): array
    {
        return ['ticketId' => $order->ticket?->id, 'orderId' => $order->id, 'paymentId' => $order->payment?->id, 'notify' => $notify];
    }
}
