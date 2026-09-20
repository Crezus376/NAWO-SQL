<?php

namespace App\Actions\Withdrawals;

use App\Models\User;
use App\Models\Withdrawal;
use App\Notifications\WithdrawalRequested;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class CreateWithdrawalAction
{
    public const FEE_RATE = 0.10;

    public const MINIMUM = 5000;

    public function __construct(private CalculateWithdrawalBalanceAction $balance) {}

    public function execute(User $user, array $data): Withdrawal
    {
        $withdrawal = DB::transaction(function () use ($user, $data) {
            User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            $balance = $this->balance->execute($user->id);
            if ($data['full_balance']) {
                $fee = round($balance * self::FEE_RATE);
                $amount = $balance - $fee;
                $total = $balance;
            } else {
                $amount = (float) $data['amount'];
                $fee = round($amount * self::FEE_RATE);
                $total = $amount + $fee;
            }
            if ($amount < self::MINIMUM) {
                throw new RuntimeException('Le montant minimum de retrait est de 5 000 FCFA.');
            }
            if ($total > $balance) {
                throw new RuntimeException('Solde insuffisant pour ce retrait, frais inclus.');
            }
            if (! empty($data['event_id']) && ! $user->events()->whereKey($data['event_id'])->exists()) {
                throw new RuntimeException('Événement introuvable.');
            }

            return Withdrawal::create(['organizer_id' => $user->id, 'event_id' => $data['event_id'] ?? null, 'amount_requested' => $amount, 'fee_amount' => $fee, 'total_debited' => $total, 'net_amount' => $amount, 'fee_rate' => self::FEE_RATE, 'payout_method' => $data['payout_method'], 'payout_details' => $data['payout_details'], 'organizer_note' => $data['note'] ?? null, 'status' => 'pending']);
        }, 5);
        $user->notify(new WithdrawalRequested($withdrawal));

        return $withdrawal;
    }
}
