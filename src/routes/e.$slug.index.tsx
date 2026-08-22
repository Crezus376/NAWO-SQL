import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Clock, MapPin, Ticket } from "lucide-react";
import { PublicShell } from "@/components/nawo/public-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatPrice } from "@/lib/nawo";

export const Route = createFileRoute("/e/$slug/")({
  validateSearch: (search: Record<string, unknown>): { ref?: string } =>
    typeof search['ref'] === "string" ? { ref: search['ref'] } : {},
  head: ({ params }) => ({
    meta: [
      { title: `Événement ${params.slug} — NAWO` },
      {
        name: "description",
        content: `Découvrez le programme, les billets et les tarifs de l'événement ${params.slug} sur NAWO.`,
      },
      { property: "og:title", content: `Événement ${params.slug} — NAWO` },
      {
        property: "og:description",
        content: `Réservez votre billet pour ${params.slug} sur NAWO.`,
      },
    ],
  }),
  component: EventPage,
});

function EventPage() {
  const { slug } = Route.useParams();
  const { ref } = useSearch({ from: "/e/$slug/" });

  const { data, isLoading } = useQuery({
    queryKey: ["event", slug],
    queryFn: async () => {
      const { data: event, error } = await supabase
        .from("events")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!event) return null;

      const [{ data: ticketTypes }, { data: page }] = await Promise.all([
        supabase
          .from("ticket_types")
          .select("*")
          .eq("event_id", event.id)
          .eq("is_active", true)
          .order("price", { ascending: true }),
        supabase.from("event_pages").select("*").eq("event_id", event.id).maybeSingle(),
      ]);

      return { event, ticketTypes: ticketTypes ?? [], page };
    },
  });

  if (isLoading) {
    return (
      <PublicShell>
        <div className="mx-auto max-w-5xl space-y-6 px-5 py-12">
          <Skeleton className="h-72 w-full rounded-3xl" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </PublicShell>
    );
  }

  if (!data?.event) {
    return (
      <PublicShell>
        <div className="mx-auto max-w-lg px-5 py-24 text-center">
          <h1 className="text-2xl font-extrabold">Événement introuvable</h1>
          <p className="mt-2 text-muted-foreground">
            Cette page n'existe pas ou l'événement n'est pas encore publié.
          </p>
          <Button className="mt-6" asChild>
            <Link to="/events">Voir les événements</Link>
          </Button>
        </div>
      </PublicShell>
    );
  }

  const { event, ticketTypes, page } = data;
  const isCustom = event.page_mode === "custom" && page?.is_active;
  const isOpen = event.status === "published" || event.status === "ongoing";

  return (
    <PublicShell>
      <div className={isCustom ? "bg-foreground text-background" : ""}>
        <div className="mx-auto w-full max-w-5xl px-5 py-10 md:py-14">
          <div className="grid gap-8 md:grid-cols-[1.1fr_1fr] md:items-start">
            <div className="overflow-hidden rounded-3xl shadow-soft">
              {event.cover_image_url ? (
                <img
                  src={event.cover_image_url}
                  alt={`Affiche de ${event.name}`}
                  className="w-full object-cover"
                />
              ) : (
                <div className="bg-brand aspect-[4/5] w-full" />
              )}
            </div>

            <div>
              {isCustom ? (
                <Badge className="mb-3 bg-accent text-accent-foreground">Page personnalisée</Badge>
              ) : null}
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{event.name}</h1>

              <div
                className={`mt-5 space-y-2 text-sm ${isCustom ? "text-background/80" : "text-muted-foreground"}`}
              >
                <p className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-primary" />
                  {formatDate(event.event_date)}
                </p>
                {event.event_time ? (
                  <p className="flex items-center gap-2">
                    <Clock className="size-4 text-primary" />
                    {event.event_time.slice(0, 5)}
                  </p>
                ) : null}
                <p className="flex items-center gap-2">
                  <MapPin className="size-4 text-accent" />
                  {event.location}
                </p>
              </div>

              {event.description ? (
                <p
                  className={`mt-6 whitespace-pre-line text-sm leading-relaxed ${isCustom ? "text-background/80" : "text-muted-foreground"}`}
                >
                  {event.description}
                </p>
              ) : null}

              <div className="mt-8 space-y-3">
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <Ticket className="size-5 text-primary" /> Billets
                </h2>

                {!isOpen ? (
                  <p className="text-sm text-muted-foreground">
                    La vente de billets n'est pas ouverte pour cet événement.
                  </p>
                ) : ticketTypes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucun billet disponible pour l'instant.
                  </p>
                ) : (
                  ticketTypes.map((type) => {
                    const soldOut = type.quantity > 0 && type.sold >= type.quantity;
                    return (
                      <div
                        key={type.id}
                        className="card-surface flex items-center justify-between gap-4 p-4 text-foreground"
                      >
                        <div>
                          <p className="font-semibold">{type.name}</p>
                          {type.description ? (
                            <p className="text-xs text-muted-foreground">{type.description}</p>
                          ) : null}
                          <p className="mt-1 text-sm font-bold text-primary">
                            {formatPrice(type.price, event.currency)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {soldOut
                              ? "Épuisé"
                              : type.quantity > 0
                                ? `${type.quantity - type.sold} disponibles`
                                : "Disponible"}
                          </p>
                        </div>
                        <Button size="sm" disabled={soldOut} asChild={!soldOut}>
                          {soldOut ? (
                            <span>Épuisé</span>
                          ) : (
                            <Link
                              to="/e/$slug/buy"
                              params={{ slug }}
                              search={{ type: type.id, ref }}
                            >
                              Acheter
                            </Link>
                          )}
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
