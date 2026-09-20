<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TicketResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, 'order_id' => $this->order_id, 'event_id' => $this->event_id,
            'ticket_type_id' => $this->ticket_type_id, 'ticket_number' => $this->ticket_number,
            'qr_token' => $this->qr_token, 'holder_first_name' => $this->holder_first_name,
            'holder_last_name' => $this->holder_last_name, 'is_used' => (bool) $this->is_used,
            'used_at' => $this->used_at, 'created_at' => $this->created_at, 'updated_at' => $this->updated_at,
        ];
    }
}
