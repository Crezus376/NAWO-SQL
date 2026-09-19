<?php

namespace App\Models;

use App\Enums\EventStatus;
use App\Exceptions\EventReadOnlyException;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Event extends BaseModel
{
    protected $casts = ['event_date' => 'date:Y-m-d'];

    public function eventStatus(): ?EventStatus
    {
        return EventStatus::tryFrom((string) $this->getRawOriginal('status'));
    }

    public function hasValidStatus(): bool
    {
        return $this->eventStatus() !== null;
    }

    public function isReadOnly(): bool
    {
        return ! $this->hasValidStatus();
    }

    public function ensureWritable(): void
    {
        if ($this->isReadOnly()) {
            throw new EventReadOnlyException();
        }
    }

    public function organizer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'organizer_id');
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(EventSession::class)->orderBy('sort_order')->orderBy('session_date');
    }

    public function ticketTypes(): HasMany
    {
        return $this->hasMany(TicketType::class);
    }

    public function page(): HasOne
    {
        return $this->hasOne(EventPage::class);
    }

    public function promoCodes(): HasMany
    {
        return $this->hasMany(PromoCode::class);
    }

    public function ambassadors(): HasMany
    {
        return $this->hasMany(Ambassador::class);
    }

    public function hosts(): HasMany
    {
        return $this->hasMany(Host::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }

    public function scans(): HasMany
    {
        return $this->hasMany(Scan::class);
    }
}
