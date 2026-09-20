<?php

namespace App\Http\Requests\Organizer;

use Illuminate\Foundation\Http\FormRequest;

class UpdateHostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['name' => 'sometimes|required|string|max:255', 'access_code' => 'sometimes|required|string|max:40', 'is_active' => 'nullable|boolean'];
    }
}
