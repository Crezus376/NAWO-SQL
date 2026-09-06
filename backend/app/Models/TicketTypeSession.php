<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;

class TicketTypeSession extends Pivot
{
    use HasUuids;

    protected $table = 'ticket_type_sessions';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = [];

    public function ticketType(): BelongsTo
    {
        return $this->belongsTo(TicketType::class);
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(EventSession::class);
    }
}
