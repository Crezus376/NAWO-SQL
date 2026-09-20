<?php

namespace App\Http\Controllers\Admin;

use App\Actions\TicketTemplates\StoreTicketTemplateAction;
use App\Actions\TicketTemplates\UpdateTicketTemplateAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexTicketTemplatesRequest;
use App\Http\Requests\Admin\StoreTicketTemplateRequest;
use App\Http\Requests\Admin\UpdateTicketTemplateRequest;
use App\Http\Resources\TicketTemplateResource;
use App\Models\TicketTemplate;

class TicketTemplateController extends Controller
{
    public function index(IndexTicketTemplatesRequest $request)
    {
        $this->authorize('administerAny', TicketTemplate::class);
        $query = TicketTemplate::with(['event', 'ticketType'])->latest();

        return TicketTemplateResource::collection($request->has('page') ? $query->paginate($request->integer('per_page', 25)) : $query->get());
    }

    public function store(StoreTicketTemplateRequest $request, StoreTicketTemplateAction $action)
    {
        $this->authorize('create', TicketTemplate::class);
        $data = $request->validated();
        unset($data['image']);

        return (new TicketTemplateResource($action->execute($data, $request->file('image'))))->response()->setStatusCode(201);
    }

    public function update(UpdateTicketTemplateRequest $request, TicketTemplate $ticketTemplate, UpdateTicketTemplateAction $action): TicketTemplateResource
    {
        $this->authorize('update', $ticketTemplate);
        $data = $request->validated();
        unset($data['image']);

        return new TicketTemplateResource($action->execute($ticketTemplate, $data, $request->file('image')));
    }
}
