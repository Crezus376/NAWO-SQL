<?php

namespace App\Http\Requests\Organizer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTicketTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['name' => 'required|string|max:255', 'price' => 'required|numeric|min:0', 'quantity' => 'required|integer|min:0', 'description' => 'nullable|string|max:5000', 'is_active' => 'nullable|boolean', 'image' => 'nullable|image|max:5120', 'session_ids' => 'nullable|array', 'session_ids.*' => ['uuid', Rule::exists('event_sessions', 'id')->where('event_id', $this->route('event')->id)]];
    }
}
