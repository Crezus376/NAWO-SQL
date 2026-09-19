<?php

namespace App\Models;

use App\Enums\UserRole as UserRoleEnum;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserRole extends BaseModel
{
    protected $casts = [
        'role' => UserRoleEnum::class,
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
