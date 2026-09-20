<?php

namespace App\Actions\Hosts;

use App\Models\Host;

class DeleteHostAction
{
    public function execute(Host $host): void
    {
        $host->event->ensureWritable();
        $host->delete();
    }
}
