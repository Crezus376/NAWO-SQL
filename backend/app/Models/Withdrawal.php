<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Withdrawal extends BaseModel
{
    protected $casts = ['amount_requested' => 'float', 'fee_amount' => 'float', 'total_debited' => 'float', 'net_amount' => 'float', 'fee_rate' => 'float', 'processed_at' => 'datetime'];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function organizer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'organizer_id');
    }
}
