import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminApi } from "@/lib/api-domain";
import { eventStatusLabel, formatDate } from "@/lib/nawo";

export const Route = createFileRoute("/_authenticated/admin/events")({
  head: () => ({
    meta: [
      { title: "Tous les événements — Administration NAWO" },
      {
        name: "description",
        content:
          "Consultez et supervisez l'ensemble des événements publiés sur la plateforme NAWO.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Tous les événements — Administration NAWO" },
      { property: "og:description", content: "Supervision des événements de la plateforme." },
    ],
  }),
  component: AdminEvents,
});

function AdminEvents() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      return adminApi.events();
    },
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  return (
    <div className="space-y-6">
      <div className="card-surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Événement</TableHead>
              <TableHead className="hidden sm:table-cell">Date</TableHead>
              <TableHead className="hidden md:table-cell">Page</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data ?? []).map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-semibold">{event.name}</TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {formatDate(event.event_date, event.event_time)}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {event.page_mode === "custom" ? "Personnalisée" : "Standard"}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{eventStatusLabel(event.status)}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/admin/events/$id" params={{ id: event.id }}>
                      Ouvrir
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Outlet />
    </div>
  );
}
