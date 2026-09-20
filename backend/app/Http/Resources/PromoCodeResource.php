<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PromoCodeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, 'event_id' => $this->event_id, 'code' => $this->code,
            'discount_type' => $this->discount_type, 'discount_value' => (float) $this->discount_value,
            'usage_limit' => $this->usage_limit, 'used_count' => $this->used_count,
            'starts_at' => $this->starts_at, 'ends_at' => $this->ends_at, 'is_active' => (bool) $this->is_active,
            'created_at' => $this->created_at, 'updated_at' => $this->updated_at,
        ];
    }
}
