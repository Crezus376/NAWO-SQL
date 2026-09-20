<?php

namespace App\Http\Controllers\PublicApi;

use App\Actions\Orders\CreateOrderAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\PublicApi\StoreOrderRequest;
use App\Models\Event;

class OrderController extends Controller
{
    public function store(StoreOrderRequest $request, Event $event, CreateOrderAction $action)
    {
        return response()->json(['data' => $action->execute($event, $request->validated())], 201);
    }
}
