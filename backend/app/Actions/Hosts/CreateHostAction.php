<?php

namespace App\Actions\Hosts;

use App\Models\Event;
use App\Models\Host;
use Illuminate\Support\Str;

class CreateHostAction
{
    public function execute(Event $event, array $data): Host
    {
        $event->ensureWritable();
        $data['access_code'] = strtoupper($data['access_code'] ?? Str::random(8));

        return Host::create([...$data, 'event_id' => $event->id]);
    }
}
