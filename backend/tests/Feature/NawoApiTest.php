<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\EventSession;
use App\Models\Host;
use App\Models\Order;
use App\Models\Ticket;
use App\Models\TicketSessionAccess;
use App\Models\TicketType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NawoApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_requires_email_verification_before_authentication(): void
    {
        $response = $this->withHeader('Origin', 'http://localhost:3000')->postJson('/api/auth/register', [
            'email' => 'organizer@example.test', 'password' => 'secret12', 'password_confirmation' => 'secret12',
        ]);

        $response->assertCreated()->assertJsonPath('data.email', 'organizer@example.test');
        $this->assertNull(User::first()->email_verified_at);
        $this->assertDatabaseHas('user_roles', ['user_id' => User::first()->id, 'role' => 'organizer']);
        $this->getJson('/api/auth/me')->assertUnauthorized();
    }

    public function test_an_organizer_cannot_read_another_organizers_event(): void
    {
        [$owner, $event] = $this->eventFixture();
        $intruder = User::create(['email' => 'intruder@example.test', 'password' => 'secret12', 'email_verified_at' => now()]);
        Sanctum::actingAs($intruder);

        $this->getJson('/api/dashboard/events/'.$event->id)->assertForbidden();
    }

    public function test_purchase_is_idempotent_and_capacity_is_locked(): void
    {
        [, $event, $type] = $this->eventFixture(quantity: 1);
        $key = fake()->uuid();
        $payload = [
            'slug' => $event->slug, 'ticket_type_id' => $type->id, 'idempotency_key' => $key,
            'first_name' => 'Ada', 'last_name' => 'Lovelace', 'email' => 'ada@example.test',
        ];

        $first = $this->postJson('/api/events/'.$event->slug.'/purchase', $payload)->assertCreated();
        $second = $this->postJson('/api/events/'.$event->slug.'/purchase', $payload)->assertCreated();
        $this->assertSame($first->json('data.ticketId'), $second->json('data.ticketId'));
        $this->assertSame(1, Order::count());
        $this->assertSame(1, Ticket::count());
        $this->assertSame(1, $type->fresh()->sold);

        $payload['idempotency_key'] = fake()->uuid();
        $this->postJson('/api/events/'.$event->slug.'/purchase', $payload)->assertUnprocessable();
    }

    public function test_a_ticket_cannot_be_scanned_twice_for_the_same_session(): void
    {
        [, $event, $type, $session] = $this->eventFixture();
        $order = Order::create(['event_id' => $event->id, 'ticket_type_id' => $type->id, 'idempotency_key' => fake()->uuid(), 'first_name' => 'A', 'last_name' => 'B', 'email' => 'a@b.test', 'status' => 'paid']);
        $ticket = Ticket::create(['order_id' => $order->id, 'event_id' => $event->id, 'ticket_type_id' => $type->id, 'ticket_number' => 'NAWO-TEST-1', 'qr_token' => 'test-token-1234', 'holder_first_name' => 'A', 'holder_last_name' => 'B']);
        TicketSessionAccess::create(['ticket_id' => $ticket->id, 'session_id' => $session->id]);
        $host = Host::create(['event_id' => $event->id, 'name' => 'Entrée', 'access_code' => 'HOST1234']);
        $payload = ['code' => $host->access_code, 'qr_token' => $ticket->qr_token, 'session_id' => $session->id];

        $this->postJson('/api/scan/ticket', $payload)->assertOk()->assertJsonPath('data.result', 'valid');
        $this->postJson('/api/scan/ticket', $payload)->assertOk()->assertJsonPath('data.result', 'already_used');
    }

    private function eventFixture(int $quantity = 10): array
    {
        $owner = User::create(['email' => fake()->unique()->safeEmail(), 'password' => 'secret12', 'email_verified_at' => now()]);
        $event = Event::create(['organizer_id' => $owner->id, 'name' => 'Test', 'slug' => fake()->unique()->slug(), 'event_date' => now()->addDay(), 'location' => 'Cotonou', 'status' => 'published']);
        $session = EventSession::create(['event_id' => $event->id, 'name' => 'Jour 1', 'session_date' => now()->addDay()]);
        $type = TicketType::create(['event_id' => $event->id, 'name' => 'Standard', 'price' => 5000, 'quantity' => $quantity]);
        $type->sessions()->attach($session->id);

        return [$owner, $event, $type, $session];
    }
}
