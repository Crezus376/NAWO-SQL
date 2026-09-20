<?php

namespace App\Http\Requests\Organizer;

use App\Enums\Currency;
use App\Enums\EventStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|required|string|max:255', 'description' => 'nullable|string|max:10000',
            'event_date' => 'sometimes|required|date', 'event_time' => 'nullable|date_format:H:i',
            'location' => 'sometimes|required|string|max:255', 'status' => ['sometimes', Rule::enum(EventStatus::class)],
            'page_mode' => ['sometimes', Rule::in(['standard', 'custom'])],
            'currency' => ['sometimes', 'nullable', Rule::enum(Currency::class)], 'cover' => 'nullable|image|max:5120',
        ];
    }
}
