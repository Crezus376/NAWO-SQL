<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Withdrawals\ProcessWithdrawalAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexWithdrawalsRequest;
use App\Http\Requests\Admin\UpdateWithdrawalRequest;
use App\Http\Resources\WithdrawalResource;
use App\Models\Withdrawal;

class WithdrawalController extends Controller
{
    public function index(IndexWithdrawalsRequest $request)
    {
        $this->authorize('administerAny', Withdrawal::class);
        $query = Withdrawal::with(['event', 'organizer'])->latest();

        return WithdrawalResource::collection($request->has('page') ? $query->paginate($request->integer('per_page', 25)) : $query->get());
    }

    public function update(UpdateWithdrawalRequest $request, Withdrawal $withdrawal, ProcessWithdrawalAction $action): WithdrawalResource
    {
        $this->authorize('administer', $withdrawal);
        $data = $request->validated();
        unset($data['proof']);

        return new WithdrawalResource($action->execute($request->user(), $withdrawal, $data, $request->file('proof')));
    }
}
