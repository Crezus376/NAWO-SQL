<?php

namespace App\Notifications;

use App\Enums\QueueName;
use Illuminate\Auth\Notifications\ResetPassword as BaseResetPassword;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPassword extends BaseResetPassword implements ShouldQueue
{
    use Queueable;

    public $tries = 3;

    public function __construct(string $token)
    {
        parent::__construct($token);
        $this->onQueue(QueueName::Emails->value);
    }

    public function toMail($notifiable): MailMessage
    {
        $url = $this->resetUrl($notifiable);

        return (new MailMessage)
            ->subject('Réinitialisation de votre mot de passe — NAWO')
            ->view('emails.auth.reset-password', [
                'user' => $notifiable,
                'url' => $url,
                'expires' => config('auth.passwords.'.config('auth.defaults.passwords').'.expire'),
            ])
            ->text('emails.auth.reset-password-text', [
                'user' => $notifiable,
                'url' => $url,
                'expires' => config('auth.passwords.'.config('auth.defaults.passwords').'.expire'),
            ]);
    }
}
