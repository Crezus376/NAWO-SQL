<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WithdrawalResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, 'organizer_id' => $this->organizer_id, 'event_id' => $this->event_id,
            'amount_requested' => (float) $this->amount_requested, 'fee_amount' => (float) $this->fee_amount,
            'total_debited' => (float) $this->total_debited, 'net_amount' => (float) $this->net_amount,
            'fee_rate' => (float) $this->fee_rate, 'payout_method' => $this->payout_method,
            'payout_details' => $this->payout_details, 'organizer_note' => $this->organizer_note,
            'status' => $this->status, 'transaction_reference' => $this->transaction_reference,
            'admin_comment' => $this->admin_comment, 'processed_by' => $this->processed_by,
            'processed_at' => $this->processed_at, 'proof_url' => $this->proof_path ? url('/api/withdrawals/'.$this->id.'/proof') : null,
            'created_at' => $this->created_at, 'updated_at' => $this->updated_at,
            'event' => new EventResource($this->whenLoaded('event')),
            'organizer' => new UserResource($this->whenLoaded('organizer')),
        ];
    }
}
