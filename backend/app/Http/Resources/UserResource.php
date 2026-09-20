<?php

namespace App\Http\Resources;

use App\Enums\UserRole as UserRoleEnum;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->resource->loadMissing('roles');
        $roles = $this->roles->pluck('role')->map(fn (UserRoleEnum $role) => $role->value)->values();

        return [
            'id' => $this->id,
            'email' => $this->email,
            'full_name' => $this->full_name,
            'email_verified' => $this->hasVerifiedEmail(),
            'roles' => $roles,
            'is_admin' => $roles->contains(UserRoleEnum::Admin->value),
        ];
    }
}
