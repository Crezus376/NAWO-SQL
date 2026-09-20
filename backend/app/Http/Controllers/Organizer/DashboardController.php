<?php

namespace App\Http\Controllers\Organizer;

use App\Actions\Dashboards\GetOrganizerDashboardAction;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function show(Request $request, GetOrganizerDashboardAction $action): array
    {
        return ['data' => $action->execute($request->user()->id)];
    }
}
