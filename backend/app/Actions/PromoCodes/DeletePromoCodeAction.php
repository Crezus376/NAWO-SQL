<?php

namespace App\Actions\PromoCodes;

use App\Models\PromoCode;

class DeletePromoCodeAction
{
    public function execute(PromoCode $promoCode): void
    {
        $promoCode->event->ensureWritable();
        $promoCode->delete();
    }
}
