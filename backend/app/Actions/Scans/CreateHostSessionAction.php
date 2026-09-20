<?php

namespace App\Actions\Scans;

use App\Models\Host;

class CreateHostSessionAction
{
    public function execute(string $code): ?array
    {
        $host = Host::with(['event.sessions'])->where('access_code', strtoupper(trim($code)))->where('is_active', true)->first();
        if (! $host) {
            return null;
        }

        return ['host_id' => $host->id, 'name' => $host->name, 'event_id' => $host->event_id, 'event_name' => $host->event->name, 'sessions' => $host->event->sessions->values()];
    }
}
