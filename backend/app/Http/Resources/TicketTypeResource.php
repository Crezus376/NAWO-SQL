<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class TicketTypeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, 'event_id' => $this->event_id, 'name' => $this->name,
            'description' => $this->description, 'price' => (float) $this->price,
            'quantity' => $this->quantity, 'sold' => $this->sold, 'is_active' => (bool) $this->is_active,
            'image_url' => $this->image_path ? Storage::disk(config('filesystems.media_disk'))->url($this->image_path) : null,
            'created_at' => $this->created_at, 'updated_at' => $this->updated_at,
            'event' => new EventResource($this->whenLoaded('event')),
            'sessions' => EventSessionResource::collection($this->whenLoaded('sessions')),
            'template' => new TicketTemplateResource($this->whenLoaded('template')),
        ];
    }
}
