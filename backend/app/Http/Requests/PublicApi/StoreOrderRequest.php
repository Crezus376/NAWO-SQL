<?php

namespace App\Http\Requests\PublicApi;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['ticket_type_id' => 'required|uuid', 'idempotency_key' => 'required|uuid', 'first_name' => 'required|string|max:80', 'last_name' => 'required|string|max:80', 'email' => ['required', 'string', 'email', 'not_regex:/[\r\n]/'], 'phone' => 'nullable|string|max:40', 'promo_code' => 'nullable|string|max:40', 'ref' => 'nullable|string|max:60'];
    }
}
