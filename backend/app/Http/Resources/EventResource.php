<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class EventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'organizer_id' => $this->organizer_id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'event_date' => $this->event_date?->format('Y-m-d'),
            'event_time' => $this->event_time,
            'location' => $this->location,
            'cover_image_url' => $this->cover_image_path ? Storage::disk(config('filesystems.media_disk'))->url($this->cover_image_path) : null,
            'status' => $this->status,
            'status_valid' => $this->hasValidStatus(),
            'is_read_only' => $this->isReadOnly(),
            'page_mode' => $this->page_mode,
            'currency' => $this->currency,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'organizer' => new UserResource($this->whenLoaded('organizer')),
            'sessions' => EventSessionResource::collection($this->whenLoaded('sessions')),
            'ticket_types' => TicketTypeResource::collection($this->whenLoaded('ticketTypes')),
            'page' => new EventPageResource($this->whenLoaded('page')),
            'ambassadors' => AmbassadorResource::collection($this->whenLoaded('ambassadors')),
            'hosts' => HostResource::collection($this->whenLoaded('hosts')),
        ];
    }
}
