<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;
use App\Models\Withdrawal;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class WithdrawalService
{
    public const FEE_RATE = 0.10;

    public const MINIMUM = 5000;

    public function balance(string $userId): float
    {
        $income = Order::whereHas('event', fn ($q) => $q->where('organizer_id', $userId))->where('status', 'paid')->sum('amount');
        $engaged = Withdrawal::where('organizer_id', $userId)->whereIn('status', ['pending', 'processing', 'paid'])->sum('total_debited');

        return (float) $income - (float) $engaged;
    }

    public function create(User $user, array $input): Withdrawal
    {
        return DB::transaction(function () use ($user, $input) {
            User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            $balance = $this->balance($user->id);
            if ($input['full_balance']) {
                $fee = round($balance * self::FEE_RATE);
                $amount = $balance - $fee;
                $total = $balance;
            } else {
                $amount = (float) $input['amount'];
                $fee = round($amount * self::FEE_RATE);
                $total = $amount + $fee;
            }
            if ($amount < self::MINIMUM) {
                throw new RuntimeException('Le montant minimum de retrait est de 5 000 FCFA.');
            }
            if ($total > $balance) {
                throw new RuntimeException('Solde insuffisant pour ce retrait, frais inclus.');
            }
            if (! empty($input['event_id']) && ! $user->events()->whereKey($input['event_id'])->exists()) {
                throw new RuntimeException('Événement introuvable.');
            }

            return Withdrawal::create([
                'organizer_id' => $user->id, 'event_id' => $input['event_id'] ?? null,
                'amount_requested' => $amount, 'fee_amount' => $fee, 'total_debited' => $total, 'net_amount' => $amount,
                'fee_rate' => self::FEE_RATE, 'payout_method' => $input['payout_method'],
                'payout_details' => $input['payout_details'], 'organizer_note' => $input['note'] ?? null, 'status' => 'pending',
            ]);
        }, 5);
    }
}
