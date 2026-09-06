<?php

namespace Tests\Feature;

use App\Models\EventPage;
use App\Models\Order;
use App\Models\TicketTypeSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesNawoFixtures;
use Tests\TestCase;

class DataApiTest extends TestCase
{
    use CreatesNawoFixtures;
    use RefreshDatabase;

    public function test_public_reads_are_allowlisted_and_hide_unpublished_inactive_data(): void
    {
        $owner = $this->user();
        $published = $this->event($owner, ['name' => 'Public']);
        $draft = $this->event($owner, ['name' => 'Draft', 'status' => 'draft']);
        EventPage::create(['event_id' => $published->id, 'brief' => 'secret', 'is_active' => false]);
        $this->ticketType($published, ['name' => 'Visible']);
        $this->ticketType($published, ['name' => 'Hidden', 'is_active' => false]);
        $this->ticketType($draft, ['name' => 'Draft ticket']);

        $this->getJson('/api/data/events')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $published->id);
        $this->getJson('/api/data/event_pages')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson('/api/data/ticket_types')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.name', 'Visible');
        $this->getJson('/api/data/orders')->assertUnauthorized();
        $this->getJson('/api/data/scans')->assertUnauthorized();
        $this->getJson('/api/data/unknown')->assertNotFound();
    }

    public function test_filters_order_limit_single_and_presented_relations_work(): void
    {
        $owner = $this->user();
        $first = $this->event($owner, ['name' => 'Alpha Festival', 'event_date' => '2027-01-01']);
        $second = $this->event($owner, ['name' => 'Beta Festival', 'event_date' => '2027-02-01']);
        $session = $this->eventSession($second);
        $type = $this->ticketType($second);
        $type->sessions()->attach($session->id);

        $this->getJson('/api/data/events?ilike[name]=%25festival%25&order=event_date:desc&limit=1')
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $second->id);
        $this->getJson('/api/data/events?in[id]='.$first->id.','.$second->id.'&eq[id]='.$first->id.'&single=1')
            ->assertOk()->assertJsonPath('data.id', $first->id);
        $this->getJson('/api/data/events?page=1&per_page=1&order=event_date:asc')->assertOk()
            ->assertJsonCount(1, 'data')->assertJsonPath('meta.total', 2)->assertJsonPath('meta.last_page', 2);
        $this->getJson('/api/data/ticket_types?eq[id]='.$type->id.'&single=1')->assertOk()
            ->assertJsonPath('data.events.id', $second->id)
            ->assertJsonPath('data.ticket_type_sessions.0.session_id', $session->id)
            ->assertJsonPath('data.ticket_type_sessions.0.event_sessions.id', $session->id);
    }

    public function test_organizer_reads_and_mutations_are_scoped_to_owned_events(): void
    {
        $owner = $this->user();
        $own = $this->event($owner, ['name' => 'Owned']);
        $foreign = $this->event($this->user(), ['name' => 'Foreign']);
        $foreignType = $this->ticketType($foreign);

        $this->actingAs($owner)->getJson('/api/data/events')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $own->id);
        $this->putJson('/api/data/events?eq[id]='.$foreign->id.'&single=1', ['values' => ['name' => 'Hacked']])->assertOk()->assertJsonPath('data', null);
        $this->assertSame('Foreign', $foreign->fresh()->name);
        $this->deleteJson('/api/data/ticket_types?eq[id]='.$foreignType->id)->assertNoContent();
        $this->assertNotNull($foreignType->fresh());
    }

    public function test_event_creation_ignores_forged_identity_slug_and_system_fields(): void
    {
        $owner = $this->user();
        $foreign = $this->user();
        $this->event($owner, ['slug' => 'nouvel-evenement']);

        $response = $this->actingAs($owner)->postJson('/api/data/events?single=1', [
            'organizer_id' => $foreign->id, 'name' => 'Nouvel Événement', 'slug' => 'forged',
            'event_date' => '2027-03-01', 'location' => 'Cotonou', 'created_at' => '2000-01-01',
        ])->assertCreated()->assertJsonPath('data.organizer_id', $owner->id)->assertJsonPath('data.slug', 'nouvel-evenement-2');
        $this->assertNotSame('2000-01-01', $response->json('data.created_at'));
    }

    public function test_child_creation_and_updates_cannot_cross_event_boundaries_or_set_admin_fields(): void
    {
        $owner = $this->user();
        $event = $this->event($owner);
        $other = $this->event($owner);
        $session = $this->eventSession($event);
        $otherSession = $this->eventSession($other);
        $type = $this->ticketType($event);

        $this->actingAs($owner)->postJson('/api/data/ticket_type_sessions?single=1', ['ticket_type_id' => $type->id, 'session_id' => $otherSession->id])
            ->assertUnprocessable();
        $this->postJson('/api/data/ticket_type_sessions?single=1', ['ticket_type_id' => $type->id, 'session_id' => $session->id])
            ->assertCreated();
        $this->assertDatabaseCount('ticket_type_sessions', 1);

        $page = $this->postJson('/api/data/event_pages?single=1', ['event_id' => $event->id, 'brief' => 'Brief', 'status' => 'active', 'is_active' => true, 'content' => ['secret' => true]])
            ->assertCreated()->assertJsonPath('data.status', 'pending')->assertJsonPath('data.is_active', false)->json('data');
        $this->putJson('/api/data/event_pages?eq[id]='.$page['id'].'&single=1', ['values' => ['brief' => 'Updated', 'event_id' => $other->id, 'is_active' => true]])
            ->assertOk()->assertJsonPath('data.brief', 'Updated')->assertJsonPath('data.event_id', $event->id)->assertJsonPath('data.is_active', false);
    }

    public function test_read_only_and_privileged_tables_reject_organizer_mutations(): void
    {
        $organizer = $this->user();
        $event = $this->event($organizer);
        $type = $this->ticketType($event);
        $order = $this->paidOrder($event, $type);
        $this->actingAs($organizer)->postJson('/api/data/orders', ['event_id' => $event->id])->assertStatus(405);
        $this->putJson('/api/data/tickets?eq[id]=x', ['values' => ['is_used' => true]])->assertStatus(405);
        $this->deleteJson('/api/data/scans?eq[id]=x')->assertStatus(405);
        $this->postJson('/api/data/ticket_templates', ['event_id' => $event->id])->assertForbidden();
        $this->postJson('/api/data/user_roles', ['user_id' => $organizer->id, 'role' => 'admin'])->assertForbidden();
        $this->assertInstanceOf(Order::class, $order->fresh());
    }

    public function test_admin_can_read_all_scoped_data_and_manage_privileged_rows(): void
    {
        $organizer = $this->user();
        $this->event($organizer);
        $admin = $this->user('admin');

        $this->actingAs($admin)->getJson('/api/data/events')->assertOk()->assertJsonCount(1, 'data');
        $created = $this->postJson('/api/data/user_roles?single=1', ['user_id' => $organizer->id, 'role' => 'support'])
            ->assertCreated()->assertJsonPath('data.role', 'support')->json('data.id');
        $this->deleteJson('/api/data/user_roles?eq[id]='.$created)->assertNoContent();
        $this->assertDatabaseMissing('user_roles', ['id' => $created]);
        $this->assertSame(0, TicketTypeSession::count());
    }
}
