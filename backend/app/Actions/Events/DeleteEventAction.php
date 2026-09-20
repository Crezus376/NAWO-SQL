<?php

namespace App\Actions\Events;

use App\Models\Event;
use Illuminate\Support\Facades\Storage;

class DeleteEventAction
{
    public function execute(Event $event): void
    {
        $event->ensureWritable();
        $files = collect([$event->cover_image_path])->merge($event->ticketTypes()->pluck('image_path'))->merge($event->ticketTypes()->with('template')->get()->pluck('template.image_path'))->filter()->all();
        $event->delete();
        Storage::disk('public')->delete($files);
    }
}
