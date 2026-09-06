<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;

class HealthController extends Controller
{
    public function __invoke()
    {
        DB::select('select 1');

        return ['data' => ['status' => 'ok', 'database' => 'ok']];
    }
}
