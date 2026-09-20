<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AmbassadorResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, 'event_id' => $this->event_id, 'name' => $this->name,
            'ref_code' => $this->ref_code, 'sales_goal' => $this->sales_goal,
            'sales_count' => $this->when(isset($this->sales_count), $this->sales_count),
            'created_at' => $this->created_at, 'updated_at' => $this->updated_at,
        ];
    }
}
