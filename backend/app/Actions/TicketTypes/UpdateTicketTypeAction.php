<?php

namespace App\Actions\TicketTypes;

use App\Models\TicketType;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class UpdateTicketTypeAction
{
    public function execute(TicketType $type, array $data, ?UploadedFile $image): TicketType
    {
        $type->event->ensureWritable();
        $oldImage = $type->image_path;
        $disk = config('filesystems.media_disk');
        $sessions = $data['session_ids'] ?? null;
        unset($data['session_ids']);
        if ($image) {
            $data['image_path'] = $image->store('ticket-images', $disk);
        }
        try {
            DB::transaction(function () use ($type, $data, $sessions) {
                $type->update($data);
                if ($sessions !== null) {
                    $type->sessions()->sync($sessions);
                }
            });
        } catch (Throwable $exception) {
            if (isset($data['image_path'])) {
                Storage::disk($disk)->delete($data['image_path']);
            }

            throw $exception;
        }
        if ($oldImage && isset($data['image_path']) && $oldImage !== $data['image_path']) {
            Storage::disk($disk)->delete($oldImage);
        }

        return $type->fresh()->load('sessions');
    }
}
