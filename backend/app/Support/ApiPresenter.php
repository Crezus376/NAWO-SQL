<?php

namespace App\Support;

use App\Models\Event;
use Illuminate\Support\Facades\Storage;

class ApiPresenter
{
    public static function row($model): array
    {
        $data = $model->toArray();
        if ($model instanceof Event) {
            $data['status_valid'] = $model->hasValidStatus();
            $data['is_read_only'] = $model->isReadOnly();
        }
        if (array_key_exists('cover_image_path', $data)) {
            $data['cover_image_url'] = $data['cover_image_path'] ? Storage::disk('public')->url($data['cover_image_path']) : null;
            unset($data['cover_image_path']);
        }
        if (array_key_exists('image_path', $data)) {
            $data['image_url'] = $data['image_path'] ? Storage::disk('public')->url($data['image_path']) : null;
            unset($data['image_path']);
        }
        if (array_key_exists('proof_path', $data)) {
            $data['proof_url'] = $data['proof_path'] ? url('/api/files/withdrawal-proofs/'.$model->id) : null;
            unset($data['proof_path']);
        }

        return $data;
    }
}
