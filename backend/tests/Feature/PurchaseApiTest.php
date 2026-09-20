<?php

namespace Tests\Feature;

use App\Models\Ambassador;
use App\Models\Order;
use App\Models\PromoCode;
use App\Models\TicketSessionAccess;
use App\Notifications\TicketPurchased;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\Concerns\CreatesNawoFixtures;
use Tests\TestCase;

class PurchaseApiTest extends TestCase
{
    use CreatesNawoFixtures;
    use RefreshDatabase;

    public function test_purchase_applies_percent_promo_ambassador_and_selected_sessions(): void
    {
        Notification::fake();
        $event = $this->event($this->user());
        $included = $this->eventSession($event, ['name' => 'Inclus']);
        $this->eventSession($event, ['name' => 'Exclu']);
        $type = $this->ticketType($event, ['price' => 10000]);
        $type->sessions()->attach($included->id);
        $promo = PromoCode::create(['event_id' => $event->id, 'code' => 'PROMO20', 'discount_type' => 'percent', 'discount_value' => 20, 'usage_limit' => 1, 'is_active' => true]);
        $ambassador = Ambassador::create(['event_id' => $event->id, 'name' => 'Alice', 'ref_code' => 'ALICE']);

        $response = $this->postJson('/api/events/'.$event->slug.'/orders', $this->payload($type->id, ['promo_code' => 'promo20', 'ref' => 'alice']))
            ->assertCreated();

        $this->assertDatabaseHas('orders', ['id' => $response->json('data.order_id'), 'amount' => 8000, 'discount' => 2000, 'promo_code_id' => $promo->id, 'ambassador_id' => $ambassador->id, 'status' => 'paid']);
        $this->assertDatabaseHas('payments', ['id' => $response->json('data.payment_id'), 'amount' => 8000, 'status' => 'paid']);
        $this->assertSame(1, TicketSessionAccess::where('ticket_id', $response->json('data.ticket_id'))->count());
        $this->assertDatabaseHas('ticket_session_access', ['ticket_id' => $response->json('data.ticket_id'), 'session_id' => $included->id]);
        $this->assertSame(1, $promo->fresh()->used_count);
        $this->assertSame(1, $type->fresh()->sold);
        Notification::assertSentOnDemand(TicketPurchased::class);
    }

    public function test_purchase_without_explicit_links_grants_all_event_sessions(): void
    {
        $event = $this->event($this->user());
        $this->eventSession($event, ['name' => 'Jour 1']);
        $this->eventSession($event, ['name' => 'Jour 2']);
        $type = $this->ticketType($event, ['quantity' => 0]);

        $response = $this->postJson('/api/events/'.$event->slug.'/orders', $this->payload($type->id))->assertCreated();
        $this->assertSame(2, TicketSessionAccess::where('ticket_id', $response->json('data.ticket_id'))->count());
    }

    public function test_fixed_discount_is_capped_at_ticket_price(): void
    {
        $event = $this->event($this->user());
        $type = $this->ticketType($event, ['price' => 5000]);
        PromoCode::create(['event_id' => $event->id, 'code' => 'FREE', 'discount_type' => 'amount', 'discount_value' => 9000, 'is_active' => true]);

        $response = $this->postJson('/api/events/'.$event->slug.'/orders', $this->payload($type->id, ['promo_code' => 'FREE']))->assertCreated();
        $this->assertDatabaseHas('orders', ['id' => $response->json('data.order_id'), 'amount' => 0, 'discount' => 5000]);
    }

    public function test_expired_inactive_or_exhausted_promos_are_ignored(): void
    {
        foreach ([
            ['code' => 'OLD', 'ends_at' => now()->subDay()],
            ['code' => 'OFF', 'is_active' => false],
            ['code' => 'USED', 'usage_limit' => 1, 'used_count' => 1],
        ] as $index => $promoData) {
            $event = $this->event($this->user());
            $type = $this->ticketType($event, ['price' => 10000]);
            PromoCode::create(array_merge(['event_id' => $event->id, 'discount_type' => 'percent', 'discount_value' => 50, 'is_active' => true], $promoData));
            $response = $this->postJson('/api/events/'.$event->slug.'/orders', $this->payload($type->id, ['promo_code' => $promoData['code'], 'idempotency_key' => fake()->uuid()]))->assertCreated();
            $ignored = Order::whereKey($response->json('data.order_id'))
                ->where('amount', 10000)->where('discount', 0)->exists();
            $this->assertTrue($ignored, "Promo #{$index} should be ignored");
        }
    }

    public function test_purchase_rejects_unavailable_event_invalid_type_and_sold_out_type(): void
    {
        $owner = $this->user();
        $draft = $this->event($owner, ['status' => 'draft']);
        $draftType = $this->ticketType($draft);
        $this->postJson('/api/events/'.$draft->slug.'/orders', $this->payload($draftType->id))->assertUnprocessable();

        $event = $this->event($owner);
        $otherType = $this->ticketType($this->event($owner));
        $this->postJson('/api/events/'.$event->slug.'/orders', $this->payload($otherType->id, ['idempotency_key' => fake()->uuid()]))->assertUnprocessable();

        $inactive = $this->ticketType($event, ['is_active' => false]);
        $this->postJson('/api/events/'.$event->slug.'/orders', $this->payload($inactive->id, ['idempotency_key' => fake()->uuid()]))->assertUnprocessable();

        $soldOut = $this->ticketType($event, ['quantity' => 2, 'sold' => 2]);
        $this->postJson('/api/events/'.$event->slug.'/orders', $this->payload($soldOut->id, ['idempotency_key' => fake()->uuid()]))->assertUnprocessable();
    }

    public function test_purchase_validates_required_fields_and_uses_route_slug(): void
    {
        $event = $this->event($this->user());
        $type = $this->ticketType($event);
        $this->postJson('/api/events/'.$event->slug.'/orders', [])->assertUnprocessable()
            ->assertJsonValidationErrors(['ticket_type_id', 'idempotency_key', 'first_name', 'last_name', 'email']);

        $payload = $this->payload($type->id, ['slug' => 'forged-body-slug']);
        $this->postJson('/api/events/'.$event->slug.'/orders', $payload)->assertCreated();
    }

    private function payload(string $ticketTypeId, array $overrides = []): array
    {
        return array_merge([
            'ticket_type_id' => $ticketTypeId,
            'idempotency_key' => fake()->uuid(),
            'first_name' => 'Ada', 'last_name' => 'Lovelace', 'email' => 'ada@example.test', 'phone' => '+2290100000000',
        ], $overrides);
    }
}
