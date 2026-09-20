<?php

namespace App\Providers;

use App\Models\Ambassador;
use App\Models\Event;
use App\Models\EventPage;
use App\Models\EventSession;
use App\Models\Host;
use App\Models\PromoCode;
use App\Models\TicketTemplate;
use App\Models\TicketType;
use App\Models\Withdrawal;
use App\Policies\AmbassadorPolicy;
use App\Policies\EventPagePolicy;
use App\Policies\EventPolicy;
use App\Policies\EventSessionPolicy;
use App\Policies\HostPolicy;
use App\Policies\PromoCodePolicy;
use App\Policies\TicketTemplatePolicy;
use App\Policies\TicketTypePolicy;
use App\Policies\WithdrawalPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Event::class => EventPolicy::class,
        EventSession::class => EventSessionPolicy::class,
        TicketType::class => TicketTypePolicy::class,
        PromoCode::class => PromoCodePolicy::class,
        Ambassador::class => AmbassadorPolicy::class,
        Host::class => HostPolicy::class,
        EventPage::class => EventPagePolicy::class,
        TicketTemplate::class => TicketTemplatePolicy::class,
        Withdrawal::class => WithdrawalPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        //
    }
}
