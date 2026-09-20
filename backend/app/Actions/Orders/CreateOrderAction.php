<?php

namespace App\Actions\Orders;

use App\Models\Event;
use App\Services\PurchaseService;

class CreateOrderAction
{
    public function __construct(private PurchaseService $service) {}

    public function execute(Event $event, array $data): array
    {
        $result = $this->service->create([...$data, 'slug' => $event->slug]);

        return [
            'ticket_id' => $result['ticketId'],
            'order_id' => $result['orderId'],
            'payment_id' => $result['paymentId'],
        ];
    }
}
