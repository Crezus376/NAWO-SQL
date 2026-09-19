<?php

namespace Tests\Feature;

use App\Models\Ambassador;
use App\Models\Event;
use App\Models\EventPage;
use App\Models\Host;
use App\Models\PromoCode;
use App\Models\Scan;
use App\Models\TicketTemplate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\CreatesNawoFixtures;
use Tests\TestCase;

class EventManagementApiTest extends TestCase
{
    use CreatesNawoFixtures;
    use RefreshDatabase;

    public function test_dashboard_and_event_lists_are_scoped_and_aggregate_paid_business_data(): void
    {
        $owner = $this->user();
        $event = $this->event($owner);
        $type = $this->ticketType($event);
        $paid = $this->paidOrder($event, $type, ['amount' => 12000]);
        $ticket = $this->ticket($paid, attributes: ['is_used' => true]);
        $this->paidOrder($event, $type, ['amount' => 8000, 'status' => 'pending']);
        Scan::create(['event_id' => $event->id, 'ticket_id' => $ticket->id, 'result' => 'valid']);
        $foreign = $this->event($this->user());

        $this->actingAs($owner)->getJson('/api/dashboard')->assertOk()->assertJsonPath('data.events', 1)
            ->assertJsonPath('data.revenue', 12000)->assertJsonPath('data.orders', 1)
            ->assertJsonPath('data.tickets', 1)->assertJsonPath('data.used_tickets', 1);
        $this->getJson('/api/dashboard/events')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $event->id);
        $this->getJson("/api/dashboard/events/{$event->id}/overview")->assertOk()
            ->assertJsonPath('data.revenue', 12000)->assertJsonPath('data.valid_scans', 1);
        $this->getJson("/api/dashboard/events/{$foreign->id}")->assertForbidden();
    }

    public function test_event_creation_validates_generates_unique_slug_forces_draft_and_stores_cover(): void
    {
        Storage::fake('public');
        $owner = $this->user();
        $this->event($owner, ['slug' => 'mon-festival']);
        $payload = ['name' => 'Mon Festival', 'event_date' => '2027-01-02', 'event_time' => '20:30', 'location' => 'Porto-Novo', 'cover' => UploadedFile::fake()->image('cover.jpg')];

        $response = $this->actingAs($owner)->postJson('/api/dashboard/events', $payload)->assertCreated()
            ->assertJsonPath('data.slug', 'mon-festival-2')->assertJsonPath('data.status', 'draft');
        $created = Event::findOrFail($response->json('data.id'));
        Storage::disk('public')->assertExists($created->cover_image_path);
        $this->assertSame($owner->id, $created->organizer_id);
        $this->postJson('/api/dashboard/events', [])->assertUnprocessable()->assertJsonValidationErrors(['name', 'event_date', 'location']);
    }

    public function test_unknown_event_status_keeps_reads_available_but_locks_all_event_writes(): void
    {
        $owner = $this->user();
        $event = $this->event($owner);
        $this->actingAs($owner)->putJson("/api/dashboard/events/{$event->id}", ['status' => 'unknown'])
            ->assertUnprocessable();

        DB::table('events')->where('id', $event->id)->update(['status' => 'unknown']);

        $this->getJson("/api/dashboard/events/{$event->id}")->assertOk()
            ->assertJsonPath('data.status', 'unknown')
            ->assertJsonPath('data.status_valid', false)
            ->assertJsonPath('data.is_read_only', true);
        $this->getJson('/api/data/events?eq[id]='.$event->id)->assertOk()
            ->assertJsonPath('data.0.status', 'unknown')
            ->assertJsonPath('data.0.is_read_only', true);

        $this->putJson("/api/dashboard/events/{$event->id}", ['name' => 'Blocked'])->assertStatus(423)
            ->assertJsonPath('code', 'event_read_only');
        $this->postJson("/api/dashboard/events/{$event->id}/sessions", ['name' => 'Jour A', 'session_date' => '2027-02-03'])
            ->assertStatus(423)->assertJsonPath('code', 'event_read_only');
        $this->putJson('/api/data/events?eq[id]='.$event->id, ['values' => ['name' => 'Blocked']])
            ->assertStatus(423)->assertJsonPath('code', 'event_read_only');
        $this->postJson('/api/data/event_sessions', ['event_id' => $event->id, 'name' => 'Jour A', 'session_date' => '2027-02-03'])
            ->assertStatus(423)->assertJsonPath('code', 'event_read_only');

        $type = $this->ticketType($event);
        $session = $this->eventSession($event);
        $this->postJson('/api/data/ticket_type_sessions', [
            'ticket_type_id' => $type->id,
            'session_id' => $session->id,
        ])->assertStatus(423)->assertJsonPath('code', 'event_read_only');
    }

    public function test_event_show_update_custom_page_and_admin_access(): void
    {
        $owner = $this->user();
        $event = $this->event($owner);
        $session = $this->eventSession($event);
        $type = $this->ticketType($event);
        $type->sessions()->attach($session->id);
        Ambassador::create(['event_id' => $event->id, 'name' => 'Amb', 'ref_code' => 'AMB']);
        Host::create(['event_id' => $event->id, 'name' => 'Host', 'access_code' => 'HOST9999']);

        $this->actingAs($owner)->getJson("/api/dashboard/events/{$event->id}")->assertOk()
            ->assertJsonCount(1, 'data.sessions')->assertJsonCount(1, 'data.ticket_types')
            ->assertJsonCount(1, 'data.ambassadors')->assertJsonCount(1, 'data.hosts');
        $this->putJson("/api/dashboard/events/{$event->id}", ['page_mode' => 'custom', 'brief' => 'Une page premium', 'status' => 'published'])
            ->assertOk()->assertJsonPath('data.page_mode', 'custom');
        $this->assertDatabaseHas('event_pages', ['event_id' => $event->id, 'brief' => 'Une page premium', 'status' => 'pending']);
        $this->actingAs($this->user('admin'))->getJson("/api/dashboard/events/{$event->id}")->assertOk();
        $this->putJson("/api/dashboard/events/{$event->id}", ['status' => 'wrong'])->assertUnprocessable();
    }

    public function test_all_nested_resources_support_create_list_update_and_delete(): void
    {
        Storage::fake('public');
        $event = $this->event($this->user());
        $this->actingAs($event->organizer);

        $sessionId = $this->postJson("/api/dashboard/events/{$event->id}/sessions", ['name' => 'Jour A', 'session_date' => '2027-02-03'])
            ->assertCreated()->json('data.id');
        $typeId = $this->postJson("/api/dashboard/events/{$event->id}/ticket-types", [
            'name' => 'VIP', 'price' => 25000, 'quantity' => 50, 'session_ids' => [$sessionId], 'image' => UploadedFile::fake()->image('ticket.png'),
        ])->assertCreated()->json('data.id');
        $promoId = $this->postJson("/api/dashboard/events/{$event->id}/promo-codes", ['code' => ' promo ', 'discount_type' => 'percent', 'discount_value' => 10])
            ->assertCreated()->assertJsonPath('data.code', 'PROMO')->json('data.id');
        $ambassadorId = $this->postJson("/api/dashboard/events/{$event->id}/ambassadors", ['name' => 'Awa', 'ref_code' => 'AWA'])
            ->assertCreated()->json('data.id');
        $hostResponse = $this->postJson("/api/dashboard/events/{$event->id}/hosts", ['name' => 'Porte 1'])->assertCreated();
        $hostId = $hostResponse->json('data.id');
        $this->assertSame(8, strlen($hostResponse->json('data.access_code')));

        foreach (['sessions', 'ticket-types', 'promo-codes', 'ambassadors', 'hosts'] as $resource) {
            $this->getJson("/api/dashboard/events/{$event->id}/{$resource}")->assertOk()->assertJsonCount(1, 'data');
        }
        $this->getJson("/api/dashboard/events/{$event->id}/ticket-types")->assertJsonPath('data.0.sessions.0.id', $sessionId);
        $this->putJson("/api/dashboard/events/{$event->id}/sessions/{$sessionId}", ['name' => 'Jour B'])->assertJsonPath('data.name', 'Jour B');
        $this->putJson("/api/dashboard/events/{$event->id}/ticket-types/{$typeId}", ['price' => 30000, 'session_ids' => []])->assertJsonPath('data.price', 30000);
        $this->putJson("/api/dashboard/events/{$event->id}/promo-codes/{$promoId}", ['is_active' => false])->assertJsonPath('data.is_active', false);
        $this->putJson("/api/dashboard/events/{$event->id}/ambassadors/{$ambassadorId}", ['sales_goal' => 25])->assertJsonPath('data.sales_goal', 25);
        $this->putJson("/api/dashboard/events/{$event->id}/hosts/{$hostId}", ['is_active' => false])->assertJsonPath('data.is_active', false);

        foreach (['sessions' => $sessionId, 'ticket-types' => $typeId, 'promo-codes' => $promoId, 'ambassadors' => $ambassadorId, 'hosts' => $hostId] as $resource => $id) {
            $this->deleteJson("/api/dashboard/events/{$event->id}/{$resource}/{$id}")->assertNoContent();
        }
    }

    public function test_nested_resources_reject_unknown_cross_event_and_foreign_records(): void
    {
        $owner = $this->user();
        $event = $this->event($owner);
        $foreign = $this->event($this->user());
        $foreignSession = $this->eventSession($foreign);
        $foreignPromo = PromoCode::create(['event_id' => $foreign->id, 'code' => 'NOPE', 'discount_value' => 1]);

        $this->actingAs($owner)->getJson("/api/dashboard/events/{$event->id}/unknown")->assertNotFound();
        $this->postJson("/api/dashboard/events/{$event->id}/ticket-types", ['name' => 'VIP', 'price' => 1, 'quantity' => 1, 'session_ids' => [$foreignSession->id]])
            ->assertUnprocessable()->assertJsonValidationErrors('session_ids.0');
        $this->putJson("/api/dashboard/events/{$event->id}/promo-codes/{$foreignPromo->id}", ['is_active' => false])->assertNotFound();
    }

    public function test_deleting_owned_event_cascades_and_foreign_delete_is_forbidden(): void
    {
        Storage::fake('public');
        $owner = $this->user();
        $event = $this->event($owner, ['cover_image_path' => 'event-images/cover.jpg']);
        $this->eventSession($event);
        $type = $this->ticketType($event, ['image_path' => 'ticket-images/type.jpg']);
        TicketTemplate::create(['event_id' => $event->id, 'ticket_type_id' => $type->id, 'image_path' => 'ticket-images/template.jpg']);
        foreach (['event-images/cover.jpg', 'ticket-images/type.jpg', 'ticket-images/template.jpg'] as $path) {
            Storage::disk('public')->put($path, 'file');
        }
        EventPage::create(['event_id' => $event->id, 'brief' => 'x']);
        $foreign = $this->event($this->user());

        $this->actingAs($owner)->deleteJson("/api/dashboard/events/{$foreign->id}")->assertForbidden();
        $this->deleteJson("/api/dashboard/events/{$event->id}")->assertNoContent();
        $this->assertDatabaseMissing('events', ['id' => $event->id]);
        $this->assertDatabaseMissing('event_sessions', ['event_id' => $event->id]);
        $this->assertDatabaseMissing('event_pages', ['event_id' => $event->id]);
        Storage::disk('public')->assertMissing('event-images/cover.jpg');
        Storage::disk('public')->assertMissing('ticket-images/type.jpg');
        Storage::disk('public')->assertMissing('ticket-images/template.jpg');
    }
}
