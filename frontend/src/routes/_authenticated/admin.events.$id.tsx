import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/lib/api-domain";
import { eventStatusLabel, formatDate } from "@/lib/nawo";

export const Route = createFileRoute("/_authenticated/admin/events/$id")({
  head: () => ({
    meta: [
      { title: "Détail événement — Administration NAWO" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminEvent,
});

function AdminEvent() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-event", id],
    queryFn: () => adminApi.event(id),
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;
  if (!data) return <p className="text-sm text-muted-foreground">Événement introuvable.</p>;

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild>
        <Link to="/admin/events">
          <ArrowLeft className="size-4" /> Retour aux événements
        </Link>
      </Button>
      <div className="card-surface space-y-5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold">{data.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Organisateur : {data.organizer?.email ?? "Inconnu"}
            </p>
          </div>
          <Badge variant="secondary">{eventStatusLabel(data.status)}</Badge>
        </div>
        <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          <p className="flex items-center gap-2">
            <CalendarDays className="size-4" />
            {formatDate(data.event_date, data.event_time)}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="size-4" />
            {data.location}
          </p>
        </div>
        {data.description ? (
          <p className="whitespace-pre-line text-sm">{data.description}</p>
        ) : null}
        <div className="grid gap-3 text-sm sm:grid-cols-3">
          <p>
            <strong>{data.sessions?.length ?? 0}</strong> journée(s)
          </p>
          <p>
            <strong>{data.ticket_types?.length ?? 0}</strong> type(s) de billet
          </p>
          <p>
            <strong>{data.hosts?.length ?? 0}</strong> agent(s) de scan
          </p>
        </div>
      </div>
    </div>
  );
}
