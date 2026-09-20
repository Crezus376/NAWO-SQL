<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class TicketTemplateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, 'event_id' => $this->event_id, 'ticket_type_id' => $this->ticket_type_id,
            'image_url' => $this->image_path ? Storage::disk(config('filesystems.media_disk'))->url($this->image_path) : null,
            'qr_x' => $this->qr_x, 'qr_y' => $this->qr_y, 'qr_width' => $this->qr_width,
            'qr_height' => $this->qr_height, 'status' => $this->status,
            'created_at' => $this->created_at, 'updated_at' => $this->updated_at,
            'event' => new EventResource($this->whenLoaded('event')),
            'ticket_type' => new TicketTypeResource($this->whenLoaded('ticketType')),
        ];
    }
}
