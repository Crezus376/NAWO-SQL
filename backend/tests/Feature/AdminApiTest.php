<?php

namespace Tests\Feature;

use App\Models\EventPage;
use App\Models\TicketTemplate;
use App\Models\Withdrawal;
use App\Notifications\WithdrawalStatusChanged;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\CreatesNawoFixtures;
use Tests\TestCase;

class AdminApiTest extends TestCase
{
    use CreatesNawoFixtures;
    use RefreshDatabase;

    public function test_admin_routes_reject_non_admin_users(): void
    {
        $user = $this->user();
        $this->actingAs($user)->getJson('/api/admin/overview')->assertForbidden();
        $this->getJson('/api/admin/events')->assertForbidden();
        $this->getJson('/api/admin/pages')->assertForbidden();
        $this->getJson('/api/admin/templates')->assertForbidden();
        $this->getJson('/api/admin/withdrawals')->assertForbidden();
    }

    public function test_overview_events_and_pages_include_global_data_and_relations(): void
    {
        $owner = $this->user();
        $event = $this->event($owner);
        $this->event($owner, ['status' => 'draft']);
        $type = $this->ticketType($event);
        $ticket = $this->ticket($this->paidOrder($event, $type, ['amount' => 15000]), attributes: ['is_used' => true]);
        $page = EventPage::create(['event_id' => $event->id, 'status' => 'pending']);

        $this->actingAs($this->user('admin'))->getJson('/api/admin/overview')->assertOk()
            ->assertJsonPath('data.events', 2)->assertJsonPath('data.published_events', 1)
            ->assertJsonPath('data.revenue', 15000)->assertJsonPath('data.orders', 1)
            ->assertJsonPath('data.tickets', 1)->assertJsonPath('data.used_tickets', 1);
        $this->getJson('/api/admin/events')->assertOk()->assertJsonCount(2, 'data')
            ->assertJsonFragment(['email' => $owner->email]);
        $this->getJson('/api/admin/events?page=1&per_page=1')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('meta.total', 2);
        $this->getJson('/api/admin/pages')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.event.id', $event->id);
        $this->putJson("/api/admin/pages/{$page->id}", ['status' => 'active', 'is_active' => true, 'preview_url' => 'https://example.test/page', 'price_amount' => 20000, 'content' => ['hero' => 'Bienvenue']])
            ->assertOk()->assertJsonPath('data.is_active', true)->assertJsonPath('data.content.hero', 'Bienvenue');
        $this->putJson("/api/admin/pages/{$page->id}", ['status' => 'invalid'])->assertUnprocessable();
        $this->assertTrue($ticket->fresh()->is_used);
    }

    public function test_ticket_template_create_upsert_update_and_event_matching_validation(): void
    {
        Storage::fake('public');
        $owner = $this->user();
        $event = $this->event($owner);
        $type = $this->ticketType($event);
        $admin = $this->user('admin');
        $payload = ['event_id' => $event->id, 'ticket_type_id' => $type->id, 'qr_x' => 10, 'qr_y' => 20, 'qr_width' => 120, 'qr_height' => 130, 'image' => UploadedFile::fake()->image('template.png')];

        $response = $this->actingAs($admin)->postJson('/api/admin/templates', $payload)->assertCreated()->assertJsonPath('data.status', 'draft');
        $template = TicketTemplate::findOrFail($response->json('data.id'));
        $firstImage = $template->image_path;
        Storage::disk('public')->assertExists($template->image_path);
        $this->postJson('/api/admin/templates', [...$payload, 'image' => null, 'qr_x' => 99, 'status' => 'active'])
            ->assertCreated()->assertJsonPath('data.id', $template->id)->assertJsonPath('data.qr_x', 99);
        $this->assertSame($firstImage, $template->fresh()->image_path);
        $this->assertDatabaseCount('ticket_templates', 1);
        $this->getJson('/api/admin/templates')->assertOk()->assertJsonPath('data.0.ticket_type.id', $type->id);
        $this->putJson("/api/admin/templates/{$template->id}", ['qr_width' => 200, 'status' => 'draft', 'image' => UploadedFile::fake()->image('replacement.jpg')])
            ->assertOk()->assertJsonPath('data.qr_width', 200);
        Storage::disk('public')->assertMissing($firstImage);

        $otherType = $this->ticketType($this->event($owner));
        $this->postJson('/api/admin/templates', [...$payload, 'ticket_type_id' => $otherType->id, 'image' => null])
            ->assertUnprocessable()->assertJsonValidationErrors('ticket_type_id');
    }

    public function test_withdrawal_processing_requires_proof_or_reference_and_cannot_pay_twice(): void
    {
        Notification::fake();
        Storage::fake('local');
        $owner = $this->user();
        $event = $this->event($owner);
        $row = $this->withdrawal($owner->id, $event->id);
        $admin = $this->user('admin');

        $this->actingAs($admin)->getJson('/api/admin/withdrawals')->assertOk()
            ->assertJsonPath('data.0.events.id', $event->id)->assertJsonPath('data.0.organizer.email', $owner->email);
        $this->postJson("/api/admin/withdrawals/{$row->id}", ['status' => 'paid'])->assertUnprocessable();
        $this->postJson("/api/admin/withdrawals/{$row->id}", ['status' => 'processing', 'comment' => 'En cours'])
            ->assertOk()->assertJsonPath('data.withdrawal.status', 'processing');
        $this->postJson("/api/admin/withdrawals/{$row->id}", ['status' => 'paid', 'reference' => 'TX-123', 'proof' => UploadedFile::fake()->create('preuve.pdf', 20, 'application/pdf')])
            ->assertOk()->assertJsonPath('data.withdrawal.transaction_reference', 'TX-123');
        $row->refresh();
        $this->assertNotNull($row->processed_at);
        $this->assertSame($admin->id, $row->processed_by);
        Storage::disk('local')->assertExists($row->proof_path);
        Notification::assertSentToTimes($owner, WithdrawalStatusChanged::class, 2);
        $this->postJson("/api/admin/withdrawals/{$row->id}", ['status' => 'paid', 'reference' => 'again'])->assertUnprocessable();
    }

    public function test_private_proof_download_is_limited_to_owner_and_admin(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('withdrawal-proofs/proof.txt', 'preuve');
        $owner = $this->user();
        $row = $this->withdrawal($owner->id, proof: 'withdrawal-proofs/proof.txt');

        $this->actingAs($owner)->get("/api/files/withdrawal-proofs/{$row->id}")->assertOk()->assertDownload('proof.txt');
        $this->actingAs($this->user())->getJson("/api/files/withdrawal-proofs/{$row->id}")->assertForbidden();
        $this->actingAs($this->user('admin'))->get("/api/files/withdrawal-proofs/{$row->id}")->assertOk();
        $row->update(['proof_path' => 'withdrawal-proofs/missing.pdf']);
        $this->getJson("/api/files/withdrawal-proofs/{$row->id}")->assertNotFound();
    }

    public function test_upload_buckets_enforce_type_visibility_and_admin_permission(): void
    {
        Storage::fake('public');
        Storage::fake('local');
        $organizer = $this->user();
        $this->actingAs($organizer)->postJson('/api/uploads/event-images', ['file' => UploadedFile::fake()->image('event.jpg')])
            ->assertOk()->assertJsonPath('data.path', fn ($path) => str_starts_with($path, 'event-images/'));
        $this->postJson('/api/uploads/event-images', ['file' => UploadedFile::fake()->create('bad.txt')])->assertUnprocessable();
        $this->postJson('/api/uploads/event-images', ['file' => UploadedFile::fake()->image('large.jpg')->size(11000)])->assertUnprocessable();
        $this->postJson('/api/uploads/unknown', ['file' => UploadedFile::fake()->image('x.jpg')])->assertNotFound();
        $this->postJson('/api/uploads/withdrawal-proofs', ['file' => UploadedFile::fake()->create('p.pdf')])->assertForbidden();
        $this->actingAs($this->user('admin'))->postJson('/api/uploads/withdrawal-proofs', ['file' => UploadedFile::fake()->create('p.pdf')])
            ->assertOk()->assertJsonPath('data.url', null);
    }

    private function withdrawal(string $ownerId, ?string $eventId = null, ?string $proof = null): Withdrawal
    {
        return Withdrawal::create([
            'organizer_id' => $ownerId, 'event_id' => $eventId, 'amount_requested' => 9000,
            'fee_amount' => 1000, 'total_debited' => 10000, 'net_amount' => 9000,
            'fee_rate' => .1, 'payout_method' => 'mobile_money', 'payout_details' => '01000000',
            'status' => 'pending', 'proof_path' => $proof,
        ]);
    }
}
