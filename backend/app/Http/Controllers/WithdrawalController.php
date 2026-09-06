<?php

namespace App\Http\Controllers;

use App\Models\Withdrawal;
use App\Notifications\WithdrawalRequested;
use App\Services\WithdrawalService;
use App\Support\ApiPresenter;
use Illuminate\Http\Request;

class WithdrawalController extends Controller
{
    public function index(Request $request, WithdrawalService $service)
    {
        $query = Withdrawal::with('event:id,name')->where('organizer_id', $request->user()->id)->latest();
        $pagination = null;
        if ($request->has('page')) {
            $paginator = $query->paginate(min(max($request->integer('per_page', 25), 1), 100));
            $rows = $paginator->getCollection()->map(fn ($row) => ApiPresenter::row($row))->values();
            $pagination = ['current_page' => $paginator->currentPage(), 'last_page' => $paginator->lastPage(), 'per_page' => $paginator->perPage(), 'total' => $paginator->total()];
        } else {
            $rows = $query->get()->map(fn ($row) => ApiPresenter::row($row))->values();
        }

        return ['data' => ['balance' => $service->balance($request->user()->id), 'withdrawals' => $rows, 'minimum' => $service::MINIMUM, 'feeRate' => $service::FEE_RATE, 'pagination' => $pagination]];
    }

    public function store(Request $request, WithdrawalService $service)
    {
        $data = $request->validate(['amount' => 'required|numeric|min:0', 'full_balance' => 'required|boolean', 'payout_method' => 'required|string|max:60', 'payout_details' => 'required|string|max:200', 'event_id' => 'nullable|uuid', 'note' => 'nullable|string|max:500']);
        $row = $service->create($request->user(), $data);
        $request->user()->notify(new WithdrawalRequested($row));

        return response()->json(['data' => ['withdrawal' => ApiPresenter::row($row), 'notified' => true]], 201);
    }

    public function receipt(Request $request, Withdrawal $withdrawal)
    {
        abort_unless($withdrawal->organizer_id === $request->user()->id || $request->user()->isAdmin(), 403);

        return ['data' => ['withdrawal' => ApiPresenter::row($withdrawal->load('event:id,name')), 'organizer' => $withdrawal->organizer->profile]];
    }
}
