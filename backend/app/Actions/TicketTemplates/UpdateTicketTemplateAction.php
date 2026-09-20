<?php

namespace App\Actions\TicketTemplates;

use App\Models\TicketTemplate;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Throwable;

class UpdateTicketTemplateAction
{
    public function execute(TicketTemplate $template, array $data, ?UploadedFile $image): TicketTemplate
    {
        $oldImage = $template->image_path;
        if ($image) {
            $data['image_path'] = $image->store('ticket-images', 'public');
        }
        try {
            $template->update($data);
        } catch (Throwable $exception) {
            if (isset($data['image_path']) && $data['image_path'] !== $oldImage) {
                Storage::disk('public')->delete($data['image_path']);
            }

            throw $exception;
        }
        if ($oldImage && isset($data['image_path']) && $oldImage !== $data['image_path']) {
            Storage::disk('public')->delete($oldImage);
        }

        return $template->fresh()->load(['event', 'ticketType']);
    }
}
