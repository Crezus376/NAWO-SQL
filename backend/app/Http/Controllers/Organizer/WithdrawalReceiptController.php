<?php

namespace App\Http\Controllers\Organizer;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Http\Resources\WithdrawalResource;
use App\Models\Withdrawal;

class WithdrawalReceiptController extends Controller
{
    public function show(Withdrawal $withdrawal): array
    {
        $this->authorize('view', $withdrawal);
        $withdrawal->load('event');

        return ['data' => ['withdrawal' => (new WithdrawalResource($withdrawal))->resolve(), 'organizer' => (new UserResource($withdrawal->organizer))->resolve()]];
    }
}
