<?php

namespace App\Http\Requests\Organizer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePromoCodeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['code' => strtoupper(trim((string) $this->input('code')))]);
    }

    public function rules(): array
    {
        return ['code' => 'required|string|max:40', 'discount_type' => ['required', Rule::in(['percent', 'amount'])], 'discount_value' => 'required|numeric|min:0', 'usage_limit' => 'nullable|integer|min:1', 'starts_at' => 'nullable|date', 'ends_at' => 'nullable|date|after_or_equal:starts_at', 'is_active' => 'nullable|boolean'];
    }
}
