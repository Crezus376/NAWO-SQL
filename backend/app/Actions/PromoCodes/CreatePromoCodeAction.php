<?php

namespace App\Actions\PromoCodes;

use App\Models\Event;
use App\Models\PromoCode;

class CreatePromoCodeAction
{
    public function execute(Event $event, array $data): PromoCode
    {
        $event->ensureWritable();

        return PromoCode::create([...$data, 'event_id' => $event->id]);
    }
}
