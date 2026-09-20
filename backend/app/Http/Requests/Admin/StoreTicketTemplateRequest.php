<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTicketTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['event_id' => 'required|uuid|exists:events,id', 'ticket_type_id' => ['required', 'uuid', Rule::exists('ticket_types', 'id')->where('event_id', $this->input('event_id'))], 'image' => 'nullable|image|max:10240', 'qr_x' => 'required|integer|min:0', 'qr_y' => 'required|integer|min:0', 'qr_width' => 'required|integer|min:20', 'qr_height' => 'required|integer|min:20', 'status' => ['nullable', Rule::in(['draft', 'active'])]];
    }
}
