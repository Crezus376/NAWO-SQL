<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['email' => ['required', 'string', 'email', 'max:255', 'not_regex:/[\r\n]/', 'unique:users,email'], 'password' => ['required', 'confirmed', Password::min((int) config('auth.password_min_length', 8))]];
    }
}
