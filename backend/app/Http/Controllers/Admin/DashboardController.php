<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Dashboards\GetAdminDashboardAction;
use App\Http\Controllers\Controller;

class DashboardController extends Controller
{
    public function show(GetAdminDashboardAction $action): array
    {
        return ['data' => $action->execute()];
    }
}
