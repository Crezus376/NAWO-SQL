<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventPageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, 'event_id' => $this->event_id, 'mode' => $this->mode,
            'status' => $this->status, 'brief' => $this->brief, 'preview_url' => $this->preview_url,
            'price_amount' => $this->price_amount === null ? null : (float) $this->price_amount,
            'is_active' => (bool) $this->is_active, 'content' => $this->content ?? [],
            'created_at' => $this->created_at, 'updated_at' => $this->updated_at,
            'event' => new EventResource($this->whenLoaded('event')),
        ];
    }
}
