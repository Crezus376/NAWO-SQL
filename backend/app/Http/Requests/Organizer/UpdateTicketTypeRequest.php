<?php

namespace App\Http\Requests\Organizer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTicketTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['name' => 'sometimes|required|string|max:255', 'price' => 'sometimes|required|numeric|min:0', 'quantity' => 'sometimes|required|integer|min:0', 'description' => 'nullable|string|max:5000', 'is_active' => 'nullable|boolean', 'image' => 'nullable|image|max:5120', 'session_ids' => 'nullable|array', 'session_ids.*' => ['uuid', Rule::exists('event_sessions', 'id')->where('event_id', $this->route('event')->id)]];
    }
}
