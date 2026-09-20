<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTicketTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['status' => ['sometimes', Rule::in(['draft', 'active'])], 'qr_x' => 'sometimes|integer|min:0', 'qr_y' => 'sometimes|integer|min:0', 'qr_width' => 'sometimes|integer|min:20', 'qr_height' => 'sometimes|integer|min:20', 'image' => 'nullable|image|max:10240'];
    }
}
