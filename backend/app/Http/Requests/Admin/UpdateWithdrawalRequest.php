<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateWithdrawalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['status' => ['required', Rule::in(['pending', 'processing', 'paid', 'rejected', 'cancelled'])], 'reference' => 'nullable|string|max:120', 'comment' => 'nullable|string|max:500', 'proof' => 'nullable|file|max:10240'];
    }
}
