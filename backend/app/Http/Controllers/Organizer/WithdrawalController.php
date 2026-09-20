<?php

namespace App\Http\Controllers\Organizer;

use App\Actions\Withdrawals\CalculateWithdrawalBalanceAction;
use App\Actions\Withdrawals\CreateWithdrawalAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Organizer\IndexWithdrawalsRequest;
use App\Http\Requests\Organizer\StoreWithdrawalRequest;
use App\Http\Resources\WithdrawalResource;
use App\Models\Withdrawal;

class WithdrawalController extends Controller
{
    public function index(IndexWithdrawalsRequest $request, CalculateWithdrawalBalanceAction $balance): array
    {
        $query = Withdrawal::with('event')->where('organizer_id', $request->user()->id)->latest();
        if ($request->has('page')) {
            $rows = $query->paginate($request->integer('per_page', 25));
            $pagination = ['current_page' => $rows->currentPage(), 'last_page' => $rows->lastPage(), 'per_page' => $rows->perPage(), 'total' => $rows->total()];
            $items = WithdrawalResource::collection($rows->getCollection())->resolve();
        } else {
            $items = WithdrawalResource::collection($query->get())->resolve();
            $pagination = null;
        }

        return ['data' => ['balance' => $balance->execute($request->user()->id), 'withdrawals' => $items, 'minimum' => CreateWithdrawalAction::MINIMUM, 'fee_rate' => CreateWithdrawalAction::FEE_RATE, 'pagination' => $pagination]];
    }

    public function store(StoreWithdrawalRequest $request, CreateWithdrawalAction $action)
    {
        $this->authorize('create', Withdrawal::class);

        return (new WithdrawalResource($action->execute($request->user(), $request->validated())))->response()->setStatusCode(201);
    }
}
