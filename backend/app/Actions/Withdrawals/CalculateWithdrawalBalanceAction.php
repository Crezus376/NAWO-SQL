<?php

namespace App\Actions\Withdrawals;

use App\Models\Order;
use App\Models\Withdrawal;

class CalculateWithdrawalBalanceAction
{
    public function execute(string $userId): float
    {
        $income = Order::whereHas('event', fn ($query) => $query->where('organizer_id', $userId))->where('status', 'paid')->sum('amount');
        $engaged = Withdrawal::where('organizer_id', $userId)->whereIn('status', ['pending', 'processing', 'paid'])->sum('total_debited');

        return (float) $income - (float) $engaged;
    }
}
