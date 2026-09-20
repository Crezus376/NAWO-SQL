import { createFileRoute, Link, Outlet, useMatchRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { DashboardShell } from "@/components/nawo/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { organizerApi } from "@/lib/api-domain";
import { eventStatusLabel, formatDate } from "@/lib/nawo";

export const Route = createFileRoute("/_authenticated/dashboard/events/$id")({
  component: EventLayout,
});

const TABS = [
  { to: "/dashboard/events/$id", label: "Aperçu", exact: true },
  { to: "/dashboard/events/$id/sessions", label: "Journées" },
  { to: "/dashboard/events/$id/tickets", label: "Billets" },
  { to: "/dashboard/events/$id/promos", label: "Codes promo" },
  { to: "/dashboard/events/$id/ambassadors", label: "Ambassadeurs" },
  { to: "/dashboard/events/$id/hosts", label: "Agents de scan" },
  { to: "/dashboard/events/$id/settings", label: "Paramètres" },
] as const;

function EventLayout() {
  const { id } = Route.useParams();
  const matchRoute = useMatchRoute();

  const { data: event } = useQuery({
    queryKey: ["event-admin", id],
    queryFn: async () => {
      return organizerApi.event(id);
    },
  });

  return (
    <DashboardShell
      title={event?.name ?? "Événement"}
      description={
        event ? `${formatDate(event.event_date, event.event_time)} · ${event.location}` : undefined
      }
      action={
        event ? (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{eventStatusLabel(event.status)}</Badge>
            <Button variant="outline" size="sm" asChild>
              <Link to="/e/$slug" params={{ slug: event.slug }} target="_blank">
                <ExternalLink className="size-4" />
                Page publique
              </Link>
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-muted p-1">
        {TABS.map((tab) => {
          const active = Boolean(
            matchRoute({ to: tab.to, params: { id }, fuzzy: !("exact" in tab) }),
          );
          return (
            <Link
              key={tab.to}
              to={tab.to}
              params={{ id }}
              className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-background text-foreground shadow-soft"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
      {event?.is_read_only ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-semibold">Événement en lecture seule</p>
          <p className="mt-1">
            Son statut est indisponible. Les modifications sont temporairement désactivées.
            Contactez l’équipe technique.
          </p>
        </div>
      ) : null}
      <Outlet />
    </DashboardShell>
  );
}
