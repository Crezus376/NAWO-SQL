import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { DashboardShell } from "@/components/nawo/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { EVENT_STATUS_LABELS, formatDate } from "@/lib/nawo";

export const Route = createFileRoute("/_authenticated/dashboard/events/")({
  head: () => ({
    meta: [
      { title: "Mes événements — NAWO" },
      {
        name: "description",
        content: "Gérez tous vos événements NAWO : brouillons, publications, ventes et entrées.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Mes événements — NAWO" },
      { property: "og:description", content: "Gérez vos événements et vos ventes." },
    ],
  }),
  component: EventsListPage,
});

function EventsListPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-events"],
    queryFn: async () => {
      const { data: events, error } = await supabase
        .from("events")
        .select("id, name, slug, event_date, event_time, location, status, page_mode")
        .order("event_date", { ascending: false });
      if (error) throw error;
      return events;
    },
  });

  return (
    <DashboardShell
      title="Mes événements"
      description="Créez, publiez et suivez chacun de vos événements."
      action={
        <Button asChild>
          <Link to="/dashboard/events/create">
            <Plus className="size-4" />
            Nouvel événement
          </Link>
        </Button>
      }
    >
      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : data?.length ? (
        <div className="card-surface overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Événement</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="hidden md:table-cell">Lieu</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-semibold">{event.name}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {formatDate(event.event_date, event.event_time)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {event.location}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {EVENT_STATUS_LABELS[event.status] ?? event.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/dashboard/events/$id" params={{ id: event.id }}>
                        Gérer
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="card-surface p-12 text-center">
          <p className="font-semibold">Aucun événement</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Lancez votre billetterie en créant un premier événement.
          </p>
          <Button className="mt-5" asChild>
            <Link to="/dashboard/events/create">
              <Plus className="size-4" />
              Créer un événement
            </Link>
          </Button>
        </div>
      )}
    </DashboardShell>
  );
}
