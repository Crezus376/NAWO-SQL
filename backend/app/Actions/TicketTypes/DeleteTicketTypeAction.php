<?php

namespace App\Actions\TicketTypes;

use App\Models\TicketType;
use Illuminate\Support\Facades\Storage;

class DeleteTicketTypeAction
{
    public function execute(TicketType $type): void
    {
        $type->event->ensureWritable();
        $files = collect([$type->image_path, $type->template?->image_path])->filter()->all();
        $type->delete();
        Storage::disk('public')->delete($files);
    }
}
