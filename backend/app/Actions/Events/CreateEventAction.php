<?php

namespace App\Actions\Events;

use App\Enums\Currency;
use App\Models\Event;
use App\Models\EventPage;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class CreateEventAction
{
    public function execute(User $organizer, array $data, ?UploadedFile $cover): Event
    {
        $path = null;
        try {
            $path = $cover?->store('event-images', 'public');
            $slugBase = Str::slug($data['name']) ?: 'evenement';
            $slug = $slugBase;
            for ($i = 2; Event::where('slug', $slug)->exists(); $i++) {
                $slug = $slugBase.'-'.$i;
            }

            return DB::transaction(function () use ($organizer, $data, $path, $slug) {
                $event = Event::create([...$data, 'organizer_id' => $organizer->id, 'slug' => $slug, 'cover_image_path' => $path, 'status' => 'draft', 'currency' => $data['currency'] ?? Currency::XOF->value]);
                if (($data['page_mode'] ?? 'standard') === 'custom') {
                    EventPage::create(['event_id' => $event->id, 'mode' => 'custom', 'status' => 'pending', 'content' => []]);
                }

                return $event;
            });
        } catch (Throwable $exception) {
            if ($path) {
                Storage::disk('public')->delete($path);
            }

            throw $exception;
        }
    }
}
