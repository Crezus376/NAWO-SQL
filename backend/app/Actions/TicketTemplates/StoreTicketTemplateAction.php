<?php

namespace App\Actions\TicketTemplates;

use App\Models\TicketTemplate;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Throwable;

class StoreTicketTemplateAction
{
    public function execute(array $data, ?UploadedFile $image): TicketTemplate
    {
        $existing = TicketTemplate::where('ticket_type_id', $data['ticket_type_id'])->first();
        $oldImage = $existing?->image_path;
        $disk = config('filesystems.media_disk');
        if ($image) {
            $data['image_path'] = $image->store('ticket-images', $disk);
        } elseif ($existing) {
            $data['image_path'] = $existing->image_path;
        }
        if (! $existing) {
            $data['status'] ??= 'draft';
        }
        try {
            $template = TicketTemplate::updateOrCreate(['ticket_type_id' => $data['ticket_type_id']], $data);
        } catch (Throwable $exception) {
            if (isset($data['image_path']) && $data['image_path'] !== $oldImage) {
                Storage::disk($disk)->delete($data['image_path']);
            }

            throw $exception;
        }
        if ($oldImage && isset($data['image_path']) && $oldImage !== $data['image_path']) {
            Storage::disk($disk)->delete($oldImage);
        }

        return $template->fresh()->load(['event', 'ticketType']);
    }
}
