<?php

namespace App\Actions\Ambassadors;

use App\Models\Ambassador;

class UpdateAmbassadorAction
{
    public function execute(Ambassador $ambassador, array $data): Ambassador
    {
        $ambassador->event->ensureWritable();
        $ambassador->update($data);

        return $ambassador->fresh();
    }
}
