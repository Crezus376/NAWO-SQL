<?php

namespace App\Notifications;

use App\Enums\QueueName;
use Illuminate\Auth\Notifications\VerifyEmail as BaseVerifyEmail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;

class VerifyEmail extends BaseVerifyEmail implements ShouldQueue
{
    use Queueable;

    public $tries = 3;

    public function __construct()
    {
        $this->onQueue(QueueName::Emails->value);
    }

    public function toMail($notifiable): MailMessage
    {
        $url = $this->verificationUrl($notifiable);

        return (new MailMessage)
            ->subject('Confirmez votre adresse email — NAWO')
            ->view('emails.auth.verify-email', [
                'user' => $notifiable,
                'url' => $url,
                'expires' => config('auth.verification.expire', 60),
            ])
            ->text('emails.auth.verify-email-text', [
                'user' => $notifiable,
                'url' => $url,
                'expires' => config('auth.verification.expire', 60),
            ]);
    }
}
