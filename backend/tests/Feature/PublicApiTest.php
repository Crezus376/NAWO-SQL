<?php

namespace Tests\Feature;

use App\Models\EventPage;
use App\Models\TicketTemplate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesNawoFixtures;
use Tests\TestCase;

class PublicApiTest extends TestCase
{
    use CreatesNawoFixtures;
    use RefreshDatabase;

    public function test_catalog_lists_only_sellable_events_in_date_order_and_honors_limit(): void
    {
        $owner = $this->user();
        $later = $this->event($owner, ['name' => 'Later', 'event_date' => '2030-02-02', 'status' => 'ongoing']);
        $earlier = $this->event($owner, ['name' => 'Earlier', 'event_date' => '2030-01-01', 'status' => 'published']);
        $this->event($owner, ['name' => 'Draft', 'status' => 'draft']);
        $this->event($owner, ['name' => 'Completed', 'status' => 'completed']);

        $this->getJson('/api/events')->assertOk()->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.id', $earlier->id)->assertJsonPath('data.1.id', $later->id);
        $this->getJson('/api/events?limit=1')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_event_detail_contains_sessions_active_tickets_and_only_active_page(): void
    {
        $owner = $this->user();
        $event = $this->event($owner, ['page_mode' => 'custom']);
        $second = $this->eventSession($event, ['name' => 'Jour 2', 'sort_order' => 2]);
        $first = $this->eventSession($event, ['name' => 'Jour 1', 'sort_order' => 1]);
        $active = $this->ticketType($event, ['name' => 'VIP', 'price' => 20000]);
        $active->sessions()->attach($first->id);
        $this->ticketType($event, ['name' => 'Hidden', 'is_active' => false]);
        $page = EventPage::create(['event_id' => $event->id, 'mode' => 'custom', 'status' => 'active', 'is_active' => true, 'content' => ['hero' => ['title' => 'Bienvenue']]]);

        $this->getJson('/api/events/'.$event->slug)->assertOk()
            ->assertJsonPath('data.event.id', $event->id)
            ->assertJsonPath('data.sessions.0.id', $first->id)
            ->assertJsonPath('data.sessions.1.id', $second->id)
            ->assertJsonCount(1, 'data.ticket_types')
            ->assertJsonPath('data.ticket_types.0.id', $active->id)
            ->assertJsonPath('data.ticket_types.0.sessions.0.id', $first->id)
            ->assertJsonPath('data.page.id', $page->id);

        $page->update(['is_active' => false]);
        $this->getJson('/api/events/'.$event->slug)->assertOk()->assertJsonPath('data.page', null);
    }

    public function test_draft_or_unknown_event_is_not_public(): void
    {
        $event = $this->event($this->user(), ['status' => 'draft']);
        $this->getJson('/api/events/'.$event->slug)->assertNotFound();
        $this->getJson('/api/events/unknown')->assertNotFound();
    }

    public function test_ticket_endpoint_returns_event_type_template_and_session_access(): void
    {
        $event = $this->event($this->user());
        $session = $this->eventSession($event);
        $type = $this->ticketType($event);
        $order = $this->paidOrder($event, $type);
        $ticket = $this->ticket($order, $session);
        $template = TicketTemplate::create(['event_id' => $event->id, 'ticket_type_id' => $type->id, 'status' => 'active', 'qr_x' => 10, 'qr_y' => 20, 'qr_width' => 100, 'qr_height' => 100]);

        $this->getJson('/api/tickets/'.$ticket->id)->assertOk()
            ->assertJsonPath('data.ticket.ticket_number', $ticket->ticket_number)
            ->assertJsonPath('data.event.id', $event->id)
            ->assertJsonPath('data.ticket_type.id', $type->id)
            ->assertJsonPath('data.template.id', $template->id)
            ->assertJsonPath('data.sessions.0.session.id', $session->id);
        $this->getJson('/api/tickets/'.fake()->uuid())->assertNotFound();
    }
}
