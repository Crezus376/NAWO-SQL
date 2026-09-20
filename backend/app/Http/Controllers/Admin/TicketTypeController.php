<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexTicketTypesRequest;
use App\Http\Resources\TicketTypeResource;
use App\Models\TicketType;

class TicketTypeController extends Controller
{
    public function index(IndexTicketTypesRequest $request)
    {
        $this->authorize('administer', TicketType::class);
        $query = TicketType::with('event')->latest();

        return TicketTypeResource::collection($request->has('page') ? $query->paginate($request->integer('per_page', 25)) : $query->get());
    }
}
