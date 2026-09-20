<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEventPageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['status' => ['sometimes', Rule::in(['pending', 'in_progress', 'ready_for_preview', 'awaiting_payment', 'paid', 'active', 'revision_requested'])], 'preview_url' => 'nullable|url|max:255', 'price_amount' => 'nullable|numeric|min:0', 'is_active' => 'nullable|boolean', 'content' => 'nullable|array'];
    }
}
