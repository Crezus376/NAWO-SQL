<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class EventSession extends BaseModel
{
    protected $casts = ['session_date' => 'date:Y-m-d'];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function ticketTypes(): BelongsToMany
    {
        return $this->belongsToMany(TicketType::class, 'ticket_type_sessions', 'session_id', 'ticket_type_id')->using(TicketTypeSession::class)->withTimestamps();
    }
}
