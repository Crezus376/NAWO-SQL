<?php

namespace App\Http\Requests\Organizer;

use Illuminate\Foundation\Http\FormRequest;

class StoreAmbassadorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['name' => 'required|string|max:255', 'ref_code' => 'required|string|max:60', 'sales_goal' => 'nullable|integer|min:0'];
    }
}
