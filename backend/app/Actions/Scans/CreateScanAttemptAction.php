<?php

namespace App\Actions\Scans;

use App\Models\Host;
use App\Models\Scan;
use App\Models\Ticket;
use App\Models\TicketSessionAccess;
use Illuminate\Support\Facades\DB;

class CreateScanAttemptAction
{
    public function execute(string $code, string $token, ?string $sessionId): array
    {
        return DB::transaction(function () use ($code, $token, $sessionId) {
            $host = Host::with(['event.sessions'])->where('access_code', strtoupper(trim($code)))->where('is_active', true)->first();
            if (! $host) {
                return ['result' => 'unauthorized'];
            }
            $target = $sessionId ?: $host->event->sessions->first()?->id;
            $session = $host->event->sessions->firstWhere('id', $target);
            if ($target && ! $session) {
                Scan::create(['event_id' => $host->event_id, 'host_id' => $host->id, 'result' => 'invalid']);

                return ['result' => 'invalid'];
            }
            $ticket = Ticket::with('ticketType')->where('qr_token', trim($token))->lockForUpdate()->first();
            if (! $ticket || $ticket->event_id !== $host->event_id) {
                Scan::create(['event_id' => $host->event_id, 'host_id' => $host->id, 'session_id' => $target, 'result' => 'invalid']);

                return ['result' => 'invalid'];
            }
            $base = ['ticket_type' => $ticket->ticketType?->name, 'holder' => $ticket->holder_first_name.' '.$ticket->holder_last_name, 'session_name' => $session?->name];
            if (! $target && $ticket->is_used) {
                Scan::create(['event_id' => $host->event_id, 'host_id' => $host->id, 'ticket_id' => $ticket->id, 'result' => 'already_used']);

                return ['result' => 'already_used'] + $base;
            }
            $access = $target ? TicketSessionAccess::where('ticket_id', $ticket->id)->where('session_id', $target)->lockForUpdate()->first() : null;
            if ($target && ! $access) {
                Scan::create(['event_id' => $host->event_id, 'host_id' => $host->id, 'session_id' => $target, 'ticket_id' => $ticket->id, 'result' => 'not_allowed']);

                return ['result' => 'not_allowed'] + $base;
            }
            if ($access?->is_used) {
                Scan::create(['event_id' => $host->event_id, 'host_id' => $host->id, 'session_id' => $target, 'ticket_id' => $ticket->id, 'result' => 'already_used']);

                return ['result' => 'already_used'] + $base;
            }
            if ($access) {
                $access->update(['is_used' => true, 'used_at' => now()]);
            }
            $remaining = TicketSessionAccess::where('ticket_id', $ticket->id)->where('is_used', false)->exists();
            $ticket->update(['is_used' => ! $remaining, 'used_at' => ! $remaining ? now() : null]);
            Scan::create(['event_id' => $host->event_id, 'host_id' => $host->id, 'session_id' => $target, 'ticket_id' => $ticket->id, 'result' => 'valid']);

            return ['result' => 'valid', 'ticket_number' => $ticket->ticket_number] + $base;
        }, 5);
    }
}
