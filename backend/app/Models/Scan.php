<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Scan extends BaseModel
{
    protected $casts = ['scanned_at' => 'datetime'];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }
}
