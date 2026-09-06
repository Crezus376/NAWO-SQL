<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventPage extends BaseModel
{
    protected $casts = ['content' => 'array', 'is_active' => 'boolean', 'price_amount' => 'float'];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }
}
