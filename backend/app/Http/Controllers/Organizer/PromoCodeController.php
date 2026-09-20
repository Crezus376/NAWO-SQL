<?php

namespace App\Http\Controllers\Organizer;

use App\Actions\PromoCodes\CreatePromoCodeAction;
use App\Actions\PromoCodes\DeletePromoCodeAction;
use App\Actions\PromoCodes\UpdatePromoCodeAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Organizer\IndexPromoCodesRequest;
use App\Http\Requests\Organizer\StorePromoCodeRequest;
use App\Http\Requests\Organizer\UpdatePromoCodeRequest;
use App\Http\Resources\PromoCodeResource;
use App\Models\Event;
use App\Models\PromoCode;
use Illuminate\Http\Response;

class PromoCodeController extends Controller
{
    public function index(IndexPromoCodesRequest $request, Event $event)
    {
        $this->authorize('viewAny', [PromoCode::class, $event]);
        $query = $event->promoCodes();

        return PromoCodeResource::collection($request->has('page') ? $query->paginate($request->integer('per_page', 25)) : $query->get());
    }

    public function store(StorePromoCodeRequest $request, Event $event, CreatePromoCodeAction $action)
    {
        $this->authorize('create', [PromoCode::class, $event]);

        return (new PromoCodeResource($action->execute($event, $request->validated())))->response()->setStatusCode(201);
    }

    public function update(UpdatePromoCodeRequest $request, Event $event, PromoCode $promoCode, UpdatePromoCodeAction $action): PromoCodeResource
    {
        $this->authorize('update', $promoCode);

        return new PromoCodeResource($action->execute($promoCode, $request->validated()));
    }

    public function destroy(Event $event, PromoCode $promoCode, DeletePromoCodeAction $action): Response
    {
        $this->authorize('delete', $promoCode);
        $action->execute($promoCode);

        return response()->noContent();
    }
}
