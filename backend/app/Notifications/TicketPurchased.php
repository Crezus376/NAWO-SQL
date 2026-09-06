<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TicketPurchased extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Order $order) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $ticket = $this->order->ticket;

        return (new MailMessage)
            ->subject('Votre billet '.$this->order->event->name)
            ->greeting('Bonjour '.$this->order->first_name.',')
            ->line('Votre achat a bien été enregistré.')
            ->action('Afficher mon billet', config('app.frontend_url').'/ticket/'.$ticket->id)
            ->line('Numéro du billet : '.$ticket->ticket_number);
    }
}
