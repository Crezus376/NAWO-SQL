<?php

namespace App\Actions\Ambassadors;

use App\Models\Ambassador;

class DeleteAmbassadorAction
{
    public function execute(Ambassador $ambassador): void
    {
        $ambassador->event->ensureWritable();
        $ambassador->delete();
    }
}
