<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, 'event_id' => $this->event_id, 'name' => $this->name,
            'access_code' => $this->access_code, 'is_active' => (bool) $this->is_active,
            'created_at' => $this->created_at, 'updated_at' => $this->updated_at,
        ];
    }
}
