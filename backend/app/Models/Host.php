<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Host extends BaseModel
{
    protected $casts = ['is_active' => 'boolean'];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }
}
