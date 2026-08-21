import { Link } from "@tanstack/react-router";
import { CalendarDays, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/nawo";

type EventCardEvent = {
  slug: string;
  name: string;
  event_date: string;
  event_time: string | null;
  location: string;
  cover_image_url: string | null;
};

export function EventCard({ event }: { event: EventCardEvent }) {
  return (
    <article className="card-surface group flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-glow">
      <div className="bg-primary-soft relative aspect-[16/10] overflow-hidden">
        {event.cover_image_url ? (
          <img
            src={event.cover_image_url}
            alt={`Affiche de ${event.name}`}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="bg-brand size-full opacity-90" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="line-clamp-2 text-lg font-bold tracking-tight">{event.name}</h3>
        <div className="space-y-1.5 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <CalendarDays className="size-4 shrink-0 text-primary" />
            {formatDate(event.event_date, event.event_time)}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0 text-accent" />
            <span className="line-clamp-1">{event.location}</span>
          </p>
        </div>
        <Button className="mt-auto w-full" asChild>
          <Link to="/e/$slug" params={{ slug: event.slug }}>
            Voir l'événement
          </Link>
        </Button>
      </div>
    </article>
  );
}
