<?php

namespace App\Http\Requests\Organizer;

use Illuminate\Foundation\Http\FormRequest;

class StoreWithdrawalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['amount' => 'required|numeric|min:0', 'full_balance' => 'required|boolean', 'payout_method' => 'required|string|max:60', 'payout_details' => 'required|string|max:200', 'event_id' => 'nullable|uuid', 'note' => 'nullable|string|max:500'];
    }
}
