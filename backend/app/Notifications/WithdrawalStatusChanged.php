<?php

namespace App\Notifications;

use App\Enums\QueueName;
use App\Models\Withdrawal;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WithdrawalStatusChanged extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Withdrawal $withdrawal)
    {
        $this->onQueue(QueueName::Emails->value);
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Mise à jour de votre retrait')
            ->line('Le statut de votre demande est maintenant : '.$this->withdrawal->status.'.')
            ->line('Montant net : '.number_format($this->withdrawal->net_amount, 0, ',', ' ').' XOF.');
    }
}
