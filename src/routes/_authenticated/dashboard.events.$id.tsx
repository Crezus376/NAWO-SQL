import { createFileRoute, Link, Outlet, useMatchRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { DashboardShell } from "@/components/nawo/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { EVENT_STATUS_LABELS, formatDate } from "@/lib/nawo";

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
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (data && data.organizer_id !== userData.user.id) {
        const { data: adminRole } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userData.user.id)
          .eq("role", "admin")
          .maybeSingle();
        if (!adminRole) return null;
      }
      return data;
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
            <Badge variant="secondary">
              {EVENT_STATUS_LABELS[event.status] ?? event.status}
            </Badge>
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
      <Outlet />
    </DashboardShell>
  );
}
