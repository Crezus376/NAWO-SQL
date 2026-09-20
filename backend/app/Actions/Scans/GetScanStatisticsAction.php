<?php

namespace App\Actions\Scans;

use App\Models\Scan;

class GetScanStatisticsAction
{
    public function __construct(private CreateHostSessionAction $hostSession) {}

    public function execute(string $code, ?string $sessionId): array
    {
        $host = $this->hostSession->execute($code);
        if (! $host) {
            return ['count' => 0, 'host' => null];
        }
        $query = Scan::where('event_id', $host['event_id'])->where('result', 'valid');
        if ($sessionId) {
            $query->where('session_id', $sessionId);
        }

        return ['count' => $query->count(), 'host' => $host];
    }
}
