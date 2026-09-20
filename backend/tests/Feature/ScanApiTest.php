<?php

namespace Tests\Feature;

use App\Models\Host;
use App\Models\Scan;
use App\Models\TicketSessionAccess;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesNawoFixtures;
use Tests\TestCase;

class ScanApiTest extends TestCase
{
    use CreatesNawoFixtures;
    use RefreshDatabase;

    public function test_host_login_is_case_insensitive_trimmed_and_only_accepts_active_hosts(): void
    {
        $event = $this->event($this->user());
        $session = $this->eventSession($event);
        $host = Host::create(['event_id' => $event->id, 'name' => 'Entrée', 'access_code' => 'ABCD1234', 'is_active' => true]);

        $this->postJson('/api/scan/host-sessions', ['code' => '  abcd1234 '])->assertOk()
            ->assertJsonPath('data.host_id', $host->id)->assertJsonPath('data.event_id', $event->id)
            ->assertJsonPath('data.sessions.0.id', $session->id);

        $host->update(['is_active' => false]);
        $this->postJson('/api/scan/host-sessions', ['code' => 'ABCD1234'])->assertOk()->assertJsonPath('data', null);
        $this->postJson('/api/scan/host-sessions', ['code' => 'x'])->assertUnprocessable()->assertJsonValidationErrors('code');
    }

    public function test_scan_results_cover_unauthorized_invalid_not_allowed_valid_and_duplicate(): void
    {
        $event = $this->event($this->user());
        $allowed = $this->eventSession($event, ['name' => 'Matin']);
        $denied = $this->eventSession($event, ['name' => 'Soir']);
        $type = $this->ticketType($event);
        $ticket = $this->ticket($this->paidOrder($event, $type), $allowed);
        Host::create(['event_id' => $event->id, 'name' => 'Scanner', 'access_code' => 'SCAN1234', 'is_active' => true]);

        $this->postJson('/api/scan/attempts', ['code' => 'BADCODE', 'qr_token' => $ticket->qr_token, 'session_id' => $allowed->id])
            ->assertOk()->assertJsonPath('data.result', 'unauthorized');
        $this->assertSame(0, Scan::count());

        $this->postJson('/api/scan/attempts', ['code' => 'SCAN1234', 'qr_token' => 'invalid-token', 'session_id' => $allowed->id])
            ->assertOk()->assertJsonPath('data.result', 'invalid');
        $this->postJson('/api/scan/attempts', ['code' => 'SCAN1234', 'qr_token' => $ticket->qr_token, 'session_id' => $denied->id])
            ->assertOk()->assertJsonPath('data.result', 'not_allowed');
        $this->postJson('/api/scan/attempts', ['code' => 'SCAN1234', 'qr_token' => $ticket->qr_token, 'session_id' => $allowed->id])
            ->assertOk()->assertJsonPath('data.result', 'valid')->assertJsonPath('data.ticket_number', $ticket->ticket_number);
        $this->assertTrue($ticket->fresh()->is_used);
        $this->assertTrue(TicketSessionAccess::first()->is_used);
        $this->postJson('/api/scan/attempts', ['code' => 'SCAN1234', 'qr_token' => $ticket->qr_token, 'session_id' => $allowed->id])
            ->assertOk()->assertJsonPath('data.result', 'already_used');
        $this->assertDatabaseCount('scans', 4);
    }

    public function test_multi_session_ticket_is_globally_used_only_after_all_accesses_are_used(): void
    {
        $event = $this->event($this->user());
        $first = $this->eventSession($event, ['name' => 'J1']);
        $second = $this->eventSession($event, ['name' => 'J2']);
        $ticket = $this->ticket($this->paidOrder($event, $this->ticketType($event)), $first);
        TicketSessionAccess::create(['ticket_id' => $ticket->id, 'session_id' => $second->id]);
        Host::create(['event_id' => $event->id, 'name' => 'Scanner', 'access_code' => 'MULTI123', 'is_active' => true]);

        $this->postJson('/api/scan/attempts', ['code' => 'MULTI123', 'qr_token' => $ticket->qr_token, 'session_id' => $first->id])
            ->assertJsonPath('data.result', 'valid');
        $this->assertFalse($ticket->fresh()->is_used);
        $this->postJson('/api/scan/attempts', ['code' => 'MULTI123', 'qr_token' => $ticket->qr_token, 'session_id' => $second->id])
            ->assertJsonPath('data.result', 'valid');
        $this->assertTrue($ticket->fresh()->is_used);

        $this->postJson('/api/scan/statistics', ['code' => 'MULTI123'])->assertOk()->assertJsonPath('data.count', 2);
        $this->postJson('/api/scan/statistics', ['code' => 'MULTI123', 'session_id' => $first->id])->assertJsonPath('data.count', 1);
        $this->postJson('/api/scan/statistics', ['code' => 'UNKNOWN'])->assertJsonPath('data.count', 0)->assertJsonPath('data.host', null);
    }

    public function test_ticket_from_another_event_and_foreign_session_are_invalid(): void
    {
        $owner = $this->user();
        $event = $this->event($owner);
        $session = $this->eventSession($event);
        Host::create(['event_id' => $event->id, 'name' => 'Scanner', 'access_code' => 'EVENT123', 'is_active' => true]);
        $other = $this->event($owner);
        $otherSession = $this->eventSession($other);
        $otherTicket = $this->ticket($this->paidOrder($other, $this->ticketType($other)), $otherSession);

        $this->postJson('/api/scan/attempts', ['code' => 'EVENT123', 'qr_token' => $otherTicket->qr_token, 'session_id' => $session->id])
            ->assertJsonPath('data.result', 'invalid');
        $ownTicket = $this->ticket($this->paidOrder($event, $this->ticketType($event)), $session);
        $this->postJson('/api/scan/attempts', ['code' => 'EVENT123', 'qr_token' => $ownTicket->qr_token, 'session_id' => $otherSession->id])
            ->assertJsonPath('data.result', 'invalid');
    }

    public function test_sessionless_ticket_can_only_be_scanned_once(): void
    {
        $event = $this->event($this->user());
        $ticket = $this->ticket($this->paidOrder($event, $this->ticketType($event)));
        Host::create(['event_id' => $event->id, 'name' => 'Scanner', 'access_code' => 'ONCE1234', 'is_active' => true]);

        $payload = ['code' => 'ONCE1234', 'qr_token' => $ticket->qr_token];
        $this->postJson('/api/scan/attempts', $payload)->assertJsonPath('data.result', 'valid');
        $this->postJson('/api/scan/attempts', $payload)->assertJsonPath('data.result', 'already_used');
    }
}
