<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ticket extends BaseModel
{
    protected $casts = ['is_used' => 'boolean', 'used_at' => 'datetime'];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function ticketType(): BelongsTo
    {
        return $this->belongsTo(TicketType::class);
    }

    public function accesses(): HasMany
    {
        return $this->hasMany(TicketSessionAccess::class);
    }
}
