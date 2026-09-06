import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicShell } from "@/components/nawo/public-shell";
import { EventCard } from "@/components/nawo/event-card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiDb } from "@/lib/api-client";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Tous les événements — NAWO" },
      {
        name: "description",
        content:
          "Parcourez tous les événements disponibles sur NAWO : concerts, soirées, conférences. Achetez votre billet en quelques secondes.",
      },
      { property: "og:title", content: "Tous les événements — NAWO" },
      {
        property: "og:description",
        content: "Parcourez tous les événements disponibles sur NAWO.",
      },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const { data: events, isLoading } = useQuery({
    queryKey: ["public-events", "all"],
    queryFn: async () => {
      const { data, error } = await apiDb
        .from("events")
        .select("id, name, slug, event_date, event_time, location, cover_image_url")
        .in("status", ["published", "ongoing"])
        .order("event_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  return (
    <PublicShell>
      <div className="mx-auto w-full max-w-6xl px-5 py-14">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Événements</h1>
        <p className="mt-2 text-muted-foreground">
          Choisissez un événement pour découvrir les billets disponibles.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? [0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-80 rounded-2xl" />)
            : events?.map((event) => <EventCard key={event.id} event={event} />)}
        </div>

        {!isLoading && (events?.length ?? 0) === 0 ? (
          <p className="mt-10 text-center text-muted-foreground">
            Aucun événement disponible pour le moment.
          </p>
        ) : null}
      </div>
    </PublicShell>
  );
}
