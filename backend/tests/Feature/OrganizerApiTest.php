<?php

namespace Tests\Feature;

use App\Models\Ambassador;
use App\Models\EventPage;
use App\Models\Host;
use App\Models\PromoCode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\Concerns\CreatesNawoFixtures;
use Tests\TestCase;

class OrganizerApiTest extends TestCase
{
    use CreatesNawoFixtures;
    use RefreshDatabase;

    public function test_organizer_routes_are_explicit_and_scoped_to_the_owner(): void
    {
        $owner = $this->user();
        $event = $this->event($owner);
        $foreign = $this->event($this->user());

        $this->actingAs($owner)->getJson('/api/organizer/events')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson("/api/organizer/events/{$event->id}")->assertOk();
        $this->getJson("/api/organizer/events/{$foreign->id}")->assertNotFound();
        $this->getJson('/api/data/events')->assertNotFound();
    }

    public function test_event_writes_validate_before_touching_the_database(): void
    {
        $owner = $this->user();
        $event = $this->event($owner, ['name' => 'Original']);

        $this->actingAs($owner)->postJson('/api/organizer/events', [
            'name' => str_repeat('x', 256),
            'event_date' => '2027-01-01',
            'location' => 'Cotonou',
        ])->assertUnprocessable()->assertJsonValidationErrors('name');

        $this->patchJson("/api/organizer/events/{$event->id}", ['name' => 'Changed', 'status' => 'unknown'])
            ->assertUnprocessable();
        $this->assertSame('Original', $event->fresh()->name);
    }

    public function test_unknown_event_status_keeps_reads_but_blocks_organizer_writes(): void
    {
        $owner = $this->user();
        $event = $this->event($owner);
        DB::table('events')->where('id', $event->id)->update(['status' => 'unknown']);

        $this->actingAs($owner)->getJson("/api/organizer/events/{$event->id}")
            ->assertOk()->assertJsonPath('data.is_read_only', true);
        $this->patchJson("/api/organizer/events/{$event->id}", ['name' => 'Blocked'])
            ->assertStatus(423)->assertJsonPath('code', 'event_read_only');
        $this->postJson("/api/organizer/events/{$event->id}/sessions", [
            'name' => 'Jour A', 'session_date' => '2027-01-01',
        ])->assertStatus(423);
    }

    public function test_custom_page_creation_has_content_and_event_updates_preserve_existing_brief(): void
    {
        $owner = $this->user();
        $event = $this->event($owner);

        $this->actingAs($owner)->patchJson("/api/organizer/events/{$event->id}", [
            'name' => 'Page personnalisée',
            'page_mode' => 'custom',
        ])->assertOk();

        $page = EventPage::where('event_id', $event->id)->firstOrFail();
        $this->assertSame([], $page->content);

        $page->update(['brief' => 'Brief à conserver', 'content' => ['hero' => ['title' => 'NAWO']]]);
        $this->actingAs($owner)->patchJson("/api/organizer/events/{$event->id}", [
            'name' => 'Nom modifié',
        ])->assertOk();

        $this->assertSame('Brief à conserver', $page->fresh()->brief);
        $this->assertSame(['hero' => ['title' => 'NAWO']], $page->fresh()->content);
    }

    public function test_routine_custom_event_updates_preserve_page_workflow_status(): void
    {
        $owner = $this->user();
        $event = $this->event($owner, ['page_mode' => 'custom']);
        $page = EventPage::create([
            'event_id' => $event->id,
            'mode' => 'custom',
            'status' => 'active',
            'content' => [],
        ]);

        $this->actingAs($owner)->patchJson("/api/organizer/events/{$event->id}", [
            'location' => 'Porto-Novo',
            'page_mode' => 'custom',
        ])->assertOk();

        $this->assertSame('active', $page->fresh()->status);
    }

    public function test_submitting_a_custom_page_brief_requests_a_new_review(): void
    {
        $owner = $this->user();
        $event = $this->event($owner, ['page_mode' => 'custom']);
        $page = EventPage::create(['event_id' => $event->id, 'mode' => 'custom', 'status' => 'active', 'content' => []]);

        $this->actingAs($owner)->patchJson("/api/organizer/events/{$event->id}/page", [
            'brief' => 'Nouveau brief',
        ])->assertOk()->assertJsonPath('data.status', 'pending')->assertJsonPath('data.brief', 'Nouveau brief');

        $this->assertSame('pending', $page->fresh()->status);
    }

    public function test_ticket_types_and_ambassadors_can_be_updated_through_explicit_routes(): void
    {
        $owner = $this->user();
        $event = $this->event($owner);
        $ticketType = $this->ticketType($event);
        $ambassador = Ambassador::create([
            'event_id' => $event->id,
            'name' => 'Initial',
            'ref_code' => 'INITIAL',
            'sales_goal' => 10,
        ]);

        $this->actingAs($owner)->patchJson("/api/organizer/events/{$event->id}/ticket-types/{$ticketType->id}", [
            'name' => 'VIP',
        ])->assertOk()->assertJsonPath('data.name', 'VIP');
        $this->patchJson("/api/organizer/events/{$event->id}/ambassadors/{$ambassador->id}", [
            'name' => 'Mis à jour',
        ])->assertOk()->assertJsonPath('data.name', 'Mis à jour');
    }

    public function test_nested_resources_cannot_be_addressed_through_another_event(): void
    {
        $owner = $this->user();
        $event = $this->event($owner);
        $foreignEvent = $this->event($owner);
        $session = $this->eventSession($foreignEvent);
        $ticketType = $this->ticketType($foreignEvent);
        $promo = PromoCode::create(['event_id' => $foreignEvent->id, 'code' => 'FOREIGN', 'discount_type' => 'percent', 'discount_value' => 10]);
        $ambassador = Ambassador::create(['event_id' => $foreignEvent->id, 'name' => 'Foreign', 'ref_code' => 'FOREIGN']);
        $host = Host::create(['event_id' => $foreignEvent->id, 'name' => 'Foreign', 'access_code' => 'FOREIGN1']);

        $this->actingAs($owner)->patchJson("/api/organizer/events/{$event->id}/sessions/{$session->id}", ['name' => 'No'])->assertNotFound();
        $this->patchJson("/api/organizer/events/{$event->id}/ticket-types/{$ticketType->id}", ['name' => 'No'])->assertNotFound();
        $this->patchJson("/api/organizer/events/{$event->id}/promo-codes/{$promo->id}", ['is_active' => false])->assertNotFound();
        $this->patchJson("/api/organizer/events/{$event->id}/ambassadors/{$ambassador->id}", ['name' => 'No'])->assertNotFound();
        $this->patchJson("/api/organizer/events/{$event->id}/hosts/{$host->id}", ['is_active' => false])->assertNotFound();
    }
}
