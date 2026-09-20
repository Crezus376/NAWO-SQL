<?php

namespace App\Actions\PromoCodes;

use App\Models\PromoCode;

class UpdatePromoCodeAction
{
    public function execute(PromoCode $promoCode, array $data): PromoCode
    {
        $promoCode->event->ensureWritable();
        $promoCode->update($data);

        return $promoCode->fresh();
    }
}
