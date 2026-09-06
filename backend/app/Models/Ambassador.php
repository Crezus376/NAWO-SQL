<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Ambassador extends BaseModel
{
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }
}
