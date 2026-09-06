<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Profile extends BaseModel
{
    public $incrementing = false;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id');
    }
}
