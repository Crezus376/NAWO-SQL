<?php

namespace App\Http\Requests\Organizer;

use App\Enums\Currency;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255', 'description' => 'nullable|string|max:10000',
            'event_date' => 'required|date', 'event_time' => 'nullable|date_format:H:i',
            'location' => 'required|string|max:255', 'page_mode' => ['nullable', Rule::in(['standard', 'custom'])],
            'currency' => ['nullable', Rule::enum(Currency::class)], 'cover' => 'nullable|image|max:5120',
        ];
    }
}
