<?php

namespace Tests\Feature;

use App\Models\Withdrawal;
use App\Notifications\WithdrawalRequested;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\Concerns\CreatesNawoFixtures;
use Tests\TestCase;

class WithdrawalApiTest extends TestCase
{
    use CreatesNawoFixtures;
    use RefreshDatabase;

    public function test_overview_computes_available_balance_and_lists_only_owners_withdrawals(): void
    {
        $user = $this->user();
        $event = $this->event($user);
        $type = $this->ticketType($event);
        $this->paidOrder($event, $type, ['amount' => 50000]);
        $this->paidOrder($event, $type, ['amount' => 9000, 'status' => 'pending']);
        $this->withdrawal($user->id, ['event_id' => $event->id, 'total_debited' => 11000, 'status' => 'processing']);
        $this->withdrawal($user->id, ['event_id' => $event->id, 'total_debited' => 8000, 'status' => 'rejected']);
        $other = $this->user();
        $this->withdrawal($other->id);

        $this->actingAs($user)->getJson('/api/organizer/withdrawals')->assertOk()
            ->assertJsonPath('data.balance', 39000)->assertJsonPath('data.minimum', 5000)
            ->assertJsonPath('data.fee_rate', 0.1)->assertJsonCount(2, 'data.withdrawals');
    }

    public function test_normal_and_full_balance_withdrawals_calculate_fees(): void
    {
        Notification::fake();
        $user = $this->user();
        $event = $this->event($user);
        $this->paidOrder($event, $this->ticketType($event), ['amount' => 30000]);

        $this->actingAs($user)->postJson('/api/organizer/withdrawals', $this->payload(['amount' => 10000, 'event_id' => $event->id]))
            ->assertCreated()->assertJsonPath('data.fee_amount', 1000)
            ->assertJsonPath('data.total_debited', 11000);
        $this->postJson('/api/organizer/withdrawals', $this->payload(['amount' => 0, 'full_balance' => true]))
            ->assertCreated()->assertJsonPath('data.amount_requested', 17100)
            ->assertJsonPath('data.fee_amount', 1900)->assertJsonPath('data.total_debited', 19000);
        $this->getJson('/api/organizer/withdrawals')->assertJsonPath('data.balance', 0);
        Notification::assertSentToTimes($user, WithdrawalRequested::class, 2);
    }

    public function test_withdrawal_rejects_minimum_insufficient_balance_foreign_event_and_invalid_input(): void
    {
        $user = $this->user();
        $event = $this->event($user);
        $this->paidOrder($event, $this->ticketType($event), ['amount' => 10000]);
        $this->actingAs($user)->postJson('/api/organizer/withdrawals', $this->payload(['amount' => 4000]))->assertUnprocessable();
        $this->postJson('/api/organizer/withdrawals', $this->payload(['amount' => 10000]))->assertUnprocessable();
        $this->postJson('/api/organizer/withdrawals', $this->payload(['amount' => 5000, 'event_id' => $this->event($this->user())->id]))->assertUnprocessable();
        $this->postJson('/api/organizer/withdrawals', [])->assertUnprocessable()
            ->assertJsonValidationErrors(['amount', 'full_balance', 'payout_method', 'payout_details']);
    }

    public function test_receipt_is_available_to_owner_and_admin_only(): void
    {
        $owner = $this->user();
        $event = $this->event($owner);
        $row = $this->withdrawal($owner->id, ['event_id' => $event->id]);

        $this->actingAs($owner)->getJson("/api/organizer/withdrawals/{$row->id}/receipt")->assertOk()
            ->assertJsonPath('data.withdrawal.event.name', $event->name)->assertJsonPath('data.organizer.email', $owner->email);
        $this->actingAs($this->user())->getJson("/api/organizer/withdrawals/{$row->id}/receipt")->assertForbidden();
        $this->actingAs($this->user('admin'))->getJson("/api/organizer/withdrawals/{$row->id}/receipt")->assertOk();
    }

    private function withdrawal(string $userId, array $attributes = []): Withdrawal
    {
        return Withdrawal::create(array_merge([
            'organizer_id' => $userId, 'amount_requested' => 9000, 'fee_amount' => 1000,
            'total_debited' => 10000, 'net_amount' => 9000, 'fee_rate' => .1,
            'payout_method' => 'mobile_money', 'payout_details' => '+22901000000', 'status' => 'pending',
        ], $attributes));
    }

    private function payload(array $overrides = []): array
    {
        return array_merge(['amount' => 5000, 'full_balance' => false, 'payout_method' => 'mobile_money', 'payout_details' => '+22901000000'], $overrides);
    }
}
