<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventSessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, 'event_id' => $this->event_id, 'name' => $this->name,
            'session_date' => $this->session_date?->format('Y-m-d'), 'start_time' => $this->start_time,
            'end_time' => $this->end_time, 'location' => $this->location, 'sort_order' => $this->sort_order,
            'created_at' => $this->created_at, 'updated_at' => $this->updated_at,
        ];
    }
}
