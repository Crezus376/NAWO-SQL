import { Link } from "@tanstack/react-router";
import { CalendarDays, MapPin, Sparkles, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CUSTOM_PAGE_THEMES, type CustomPageContent } from "@/lib/custom-page";
import { formatDate, formatPrice } from "@/lib/nawo";

type SessionRow = {
  id: string;
  name: string;
  session_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
};

type TicketTypeRow = {
  id: string;
  name: string;
  price: number | string;
  description: string | null;
  quantity: number;
  sold: number;
  sessionNames: string[];
};

type Props = {
  content: CustomPageContent;
  event: {
    name: string;
    slug: string;
    description: string | null;
    location: string;
    currency: string;
    cover_image_url: string | null;
    event_date: string;
  };
  sessions: SessionRow[];
  ticketTypes: TicketTypeRow[];
  isOpen: boolean;
  refCode?: string | undefined;
};

export function CustomEventPage({ content, event, sessions, ticketTypes, isOpen, refCode }: Props) {
  const theme = CUSTOM_PAGE_THEMES[content.theme ?? "gold"];
  const hero = content.heroImage || event.cover_image_url;

  return (
    <div className={`${theme.page} min-h-screen`}>
      <section className="relative overflow-hidden">
        {hero ? (
          <img
            src={hero}
            alt={`Affiche de ${event.name}`}
            className="absolute inset-0 size-full object-cover opacity-40"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-black" />
        <div className="relative mx-auto max-w-4xl px-5 py-20 text-center md:py-28">
          {content.tagline ? (
            <p
              className={`inline-flex items-center gap-2 rounded-full ${theme.accentSoft} ${theme.accent} px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em]`}
            >
              <Sparkles className="size-3.5" />
              {content.tagline}
            </p>
          ) : null}
          <h1 className="mt-6 text-4xl font-black uppercase tracking-tight sm:text-6xl">
            {content.headline || event.name}
          </h1>
          {content.subheadline ? (
            <p className={`mt-4 text-lg ${theme.accent}`}>{content.subheadline}</p>
          ) : null}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm opacity-85">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="size-4" />
              {sessions.length > 0
                ? `${sessions.length} journée${sessions.length > 1 ? "s" : ""} · ${formatDate(sessions[0]!.session_date)}`
                : formatDate(event.event_date)}
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin className="size-4" />
              {event.location}
            </span>
          </div>
          {isOpen && ticketTypes.length > 0 ? (
            <Button size="lg" className="mt-9" asChild>
              <a href="#billets">{content.ctaLabel || "Réserver ma place"}</a>
            </Button>
          ) : null}
        </div>
      </section>

      {content.about || event.description ? (
        <section className="mx-auto max-w-3xl px-5 py-14 text-center">
          <p className="whitespace-pre-line text-base leading-relaxed opacity-85">
            {content.about || event.description}
          </p>
        </section>
      ) : null}

      {content.highlights?.length ? (
        <section className="mx-auto max-w-5xl px-5 pb-14">
          <div className="grid gap-4 sm:grid-cols-3">
            {content.highlights.map((h) => (
              <div
                key={h.title}
                className={`rounded-2xl border ${theme.border} ${theme.accentSoft} p-5 text-center`}
              >
                <p className={`text-sm font-bold uppercase tracking-wide ${theme.accent}`}>
                  {h.title}
                </p>
                <p className="mt-2 text-sm opacity-80">{h.text}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {sessions.length > 0 ? (
        <section className="mx-auto max-w-4xl px-5 pb-14">
          <h2 className={`text-center text-2xl font-black uppercase ${theme.accent}`}>Programme</h2>
          <div className="mt-6 space-y-3">
            {sessions.map((session, index) => (
              <div
                key={session.id}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border ${theme.border} p-4`}
              >
                <div>
                  <p className="font-bold">
                    Jour {index + 1} — {session.name}
                  </p>
                  <p className="text-sm opacity-70">
                    {formatDate(session.session_date, session.start_time)}
                    {session.end_time ? ` → ${session.end_time.slice(0, 5)}` : ""}
                  </p>
                </div>
                {session.location ? <p className="text-sm opacity-70">{session.location}</p> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {content.lineup?.length ? (
        <section className="mx-auto max-w-4xl px-5 pb-14">
          <h2 className={`text-center text-2xl font-black uppercase ${theme.accent}`}>Line-up</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {content.lineup.map((artist) => (
              <div
                key={artist.name}
                className={`rounded-full border ${theme.border} px-5 py-2 text-sm font-semibold`}
              >
                {artist.name}
                {artist.role ? <span className="opacity-60"> · {artist.role}</span> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section id="billets" className="mx-auto max-w-4xl px-5 pb-20">
        <h2
          className={`flex items-center justify-center gap-2 text-2xl font-black uppercase ${theme.accent}`}
        >
          <Ticket className="size-6" /> Billets
        </h2>
        <div className="mt-6 space-y-3">
          {!isOpen ? (
            <p className="text-center text-sm opacity-70">
              La billetterie n'est pas encore ouverte.
            </p>
          ) : ticketTypes.length === 0 ? (
            <p className="text-center text-sm opacity-70">
              Aucun billet disponible pour l'instant.
            </p>
          ) : (
            ticketTypes.map((type) => {
              const soldOut = type.quantity > 0 && type.sold >= type.quantity;
              return (
                <div
                  key={type.id}
                  className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border ${theme.border} ${theme.accentSoft} p-5`}
                >
                  <div>
                    <p className="text-lg font-bold uppercase">{type.name}</p>
                    {type.description ? (
                      <p className="text-sm opacity-70">{type.description}</p>
                    ) : null}
                    {type.sessionNames.length ? (
                      <p className="mt-1 text-xs opacity-60">
                        Accès : {type.sessionNames.join(" · ")}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-4">
                    <p className={`text-lg font-black ${theme.accent}`}>
                      {formatPrice(type.price, event.currency)}
                    </p>
                    <Button disabled={soldOut} asChild={!soldOut}>
                      {soldOut ? (
                        <span>Épuisé</span>
                      ) : (
                        <Link
                          to="/e/$slug/buy"
                          params={{ slug: event.slug }}
                          search={{ type: type.id, ...(refCode ? { ref: refCode } : {}) }}
                        >
                          Acheter
                        </Link>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {content.dressCode ? (
          <p className="mt-8 text-center text-sm uppercase tracking-[0.2em] opacity-70">
            Dress code : {content.dressCode}
          </p>
        ) : null}
        {content.infoNote ? (
          <p className="mt-3 text-center text-xs opacity-60">{content.infoNote}</p>
        ) : null}
      </section>
    </div>
  );
}
