<?php

namespace App\Actions\Events;

use App\Enums\Currency;
use App\Models\Event;
use App\Models\EventPage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class UpdateEventAction
{
    public function execute(Event $event, array $data, ?UploadedFile $cover): Event
    {
        $event->ensureWritable();
        $oldCover = $event->cover_image_path;
        if ($cover) {
            $data['cover_image_path'] = $cover->store('event-images', 'public');
        }
        if (array_key_exists('currency', $data) && $data['currency'] === null) {
            $data['currency'] = Currency::XOF->value;
        }

        try {
            DB::transaction(function () use ($event, $data) {
                $event->update($data);
                if (($data['page_mode'] ?? null) === 'custom' && ! $event->page()->exists()) {
                    EventPage::create(['event_id' => $event->id, 'mode' => 'custom', 'status' => 'pending', 'content' => []]);
                }
            });
        } catch (Throwable $exception) {
            if (isset($data['cover_image_path'])) {
                Storage::disk('public')->delete($data['cover_image_path']);
            }

            throw $exception;
        }
        if (isset($data['cover_image_path']) && $oldCover && $oldCover !== $data['cover_image_path']) {
            Storage::disk('public')->delete($oldCover);
        }

        return $event->fresh();
    }
}
