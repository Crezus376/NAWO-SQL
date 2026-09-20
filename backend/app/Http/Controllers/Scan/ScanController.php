<?php

namespace App\Http\Controllers\Scan;

use App\Actions\Scans\CreateScanAttemptAction;
use App\Actions\Scans\GetScanStatisticsAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Scan\ShowScanStatisticsRequest;
use App\Http\Requests\Scan\StoreScanAttemptRequest;

class ScanController extends Controller
{
    public function attempt(StoreScanAttemptRequest $request, CreateScanAttemptAction $action): array
    {
        $data = $request->validated();

        return ['data' => $action->execute($data['code'], $data['qr_token'], $data['session_id'] ?? null)];
    }

    public function statistics(ShowScanStatisticsRequest $request, GetScanStatisticsAction $action): array
    {
        $data = $request->validated();

        return ['data' => $action->execute($data['code'], $data['session_id'] ?? null)];
    }
}
