<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class ResetPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['token' => 'required', 'email' => ['required', 'string', 'email', 'not_regex:/[\r\n]/'], 'password' => ['required', 'confirmed', Password::min((int) config('auth.password_min_length', 8))]];
    }
}
