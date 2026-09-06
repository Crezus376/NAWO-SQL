<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PromoCode extends BaseModel
{
    protected $casts = ['discount_value' => 'float', 'is_active' => 'boolean', 'starts_at' => 'datetime', 'ends_at' => 'datetime'];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }
}
