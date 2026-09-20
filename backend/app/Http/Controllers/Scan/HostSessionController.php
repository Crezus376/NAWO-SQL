<?php

namespace App\Http\Controllers\Scan;

use App\Actions\Scans\CreateHostSessionAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Scan\StoreHostSessionRequest;

class HostSessionController extends Controller
{
    public function store(StoreHostSessionRequest $request, CreateHostSessionAction $action): array
    {
        return ['data' => $action->execute($request->validated('code'))];
    }
}
