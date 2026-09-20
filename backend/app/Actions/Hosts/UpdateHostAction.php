<?php

namespace App\Actions\Hosts;

use App\Models\Host;

class UpdateHostAction
{
    public function execute(Host $host, array $data): Host
    {
        $host->event->ensureWritable();
        if (isset($data['access_code'])) {
            $data['access_code'] = strtoupper(trim($data['access_code']));
        } $host->update($data);

        return $host->fresh();
    }
}
