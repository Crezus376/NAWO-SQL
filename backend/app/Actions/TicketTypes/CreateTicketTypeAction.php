<?php

namespace App\Actions\TicketTypes;

use App\Models\Event;
use App\Models\TicketType;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class CreateTicketTypeAction
{
    public function execute(Event $event, array $data, ?UploadedFile $image): TicketType
    {
        $event->ensureWritable();
        $disk = config('filesystems.media_disk');
        $sessions = $data['session_ids'] ?? [];
        unset($data['session_ids']);
        if ($image) {
            $data['image_path'] = $image->store('ticket-images', $disk);
        }

        try {
            return DB::transaction(function () use ($event, $data, $sessions) {
                $type = TicketType::create([...$data, 'event_id' => $event->id]);
                $type->sessions()->sync($sessions);

                return $type->load('sessions');
            });
        } catch (Throwable $exception) {
            if (isset($data['image_path'])) {
                Storage::disk($disk)->delete($data['image_path']);
            }

            throw $exception;
        }
    }
}
