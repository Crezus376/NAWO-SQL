<?php

namespace App\Http\Requests\Organizer;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAmbassadorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['name' => 'sometimes|required|string|max:255', 'ref_code' => 'sometimes|required|string|max:60', 'sales_goal' => 'nullable|integer|min:0'];
    }
}
