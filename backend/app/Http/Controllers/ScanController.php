<?php

namespace App\Http\Controllers;

use App\Services\ScanService;
use Illuminate\Http\Request;

class ScanController extends Controller
{
    public function login(Request $request, ScanService $service)
    {
        $data = $request->validate(['code' => 'required|string|min:4|max:40']);

        return ['data' => $service->resolveHost($data['code'])];
    }

    public function scan(Request $request, ScanService $service)
    {
        $data = $request->validate(['code' => 'required|string|min:4|max:40', 'qr_token' => 'required|string|min:4|max:120', 'session_id' => 'nullable|uuid']);

        return ['data' => $service->scan($data['code'], $data['qr_token'], $data['session_id'] ?? null)];
    }

    public function stats(Request $request, ScanService $service)
    {
        $data = $request->validate(['code' => 'required|string|min:4|max:40', 'session_id' => 'nullable|uuid']);

        return ['data' => $service->stats($data['code'], $data['session_id'] ?? null)];
    }
}
