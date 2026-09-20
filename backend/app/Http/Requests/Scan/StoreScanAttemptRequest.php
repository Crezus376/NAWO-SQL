<?php

namespace App\Http\Requests\Scan;

use Illuminate\Foundation\Http\FormRequest;

class StoreScanAttemptRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['code' => strtoupper(trim((string) $this->input('code'))), 'qr_token' => trim((string) $this->input('qr_token'))]);
    }

    public function rules(): array
    {
        return ['code' => 'required|string|min:4|max:40', 'qr_token' => 'required|string|min:4|max:120', 'session_id' => 'nullable|uuid'];
    }
}
