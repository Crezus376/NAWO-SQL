<?php

namespace Tests\Concerns;

use App\Enums\UserRole as UserRoleEnum;
use App\Models\Event;
use App\Models\EventSession;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Ticket;
use App\Models\TicketSessionAccess;
use App\Models\TicketType;
use App\Models\User;
use App\Models\UserRole;

trait CreatesNawoFixtures
{
    protected function user(UserRoleEnum|string $role = UserRoleEnum::Organizer, ?string $email = null): User
    {
        $user = User::create(['email' => $email ?? fake()->unique()->safeEmail(), 'full_name' => fake()->name(), 'password' => 'secret12', 'email_verified_at' => now()]);
        UserRole::create(['user_id' => $user->id, 'role' => $role instanceof UserRoleEnum ? $role : UserRoleEnum::from($role)]);

        return $user;
    }

    protected function event(User $owner, array $attributes = []): Event
    {
        return Event::create(array_merge([
            'organizer_id' => $owner->id,
            'name' => 'Événement '.fake()->unique()->word(),
            'slug' => fake()->unique()->slug(),
            'description' => 'Description',
            'event_date' => now()->addWeek()->toDateString(),
            'event_time' => '18:00',
            'location' => 'Cotonou',
            'status' => 'published',
            'page_mode' => 'standard',
            'currency' => 'XOF',
        ], $attributes));
    }

    protected function eventSession(Event $event, array $attributes = []): EventSession
    {
        return EventSession::create(array_merge([
            'event_id' => $event->id,
            'name' => 'Jour 1',
            'session_date' => $event->event_date,
            'start_time' => '18:00',
            'sort_order' => 0,
        ], $attributes));
    }

    protected function ticketType(Event $event, array $attributes = []): TicketType
    {
        return TicketType::create(array_merge([
            'event_id' => $event->id,
            'name' => 'Standard',
            'price' => 10000,
            'quantity' => 100,
            'sold' => 0,
            'is_active' => true,
        ], $attributes));
    }

    protected function paidOrder(Event $event, TicketType $type, array $attributes = []): Order
    {
        $order = Order::create(array_merge([
            'event_id' => $event->id,
            'ticket_type_id' => $type->id,
            'idempotency_key' => fake()->uuid(),
            'first_name' => 'Ada',
            'last_name' => 'Lovelace',
            'email' => 'ada@example.test',
            'amount' => $type->price,
            'discount' => 0,
            'status' => 'paid',
        ], $attributes));
        Payment::create(['order_id' => $order->id, 'provider' => 'manual', 'amount' => $order->amount, 'status' => 'paid']);

        return $order;
    }

    protected function ticket(Order $order, ?EventSession $session = null, array $attributes = []): Ticket
    {
        $ticket = Ticket::create(array_merge([
            'order_id' => $order->id,
            'event_id' => $order->event_id,
            'ticket_type_id' => $order->ticket_type_id,
            'ticket_number' => 'NAWO-'.fake()->unique()->bothify('####-????'),
            'qr_token' => fake()->unique()->uuid().'.token',
            'holder_first_name' => $order->first_name,
            'holder_last_name' => $order->last_name,
        ], $attributes));
        if ($session) {
            TicketSessionAccess::create(['ticket_id' => $ticket->id, 'session_id' => $session->id]);
        }

        return $ticket;
    }
}
