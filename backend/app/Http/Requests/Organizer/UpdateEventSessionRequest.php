<?php

namespace App\Http\Requests\Organizer;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEventSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['name' => 'sometimes|required|string|max:255', 'session_date' => 'sometimes|required|date', 'start_time' => 'nullable|date_format:H:i', 'end_time' => 'nullable|date_format:H:i', 'location' => 'nullable|string|max:255', 'sort_order' => 'nullable|integer|min:0'];
    }
}
