import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Plus, Receipt, Ticket, Wallet } from "lucide-react";
import { DashboardShell } from "@/components/nawo/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { organizerApi } from "@/lib/api-domain";
import { eventStatusLabel, formatDate, formatPrice } from "@/lib/nawo";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({
    meta: [
      { title: "Tableau de bord organisateur — NAWO" },
      {
        name: "description",
        content: "Suivez vos ventes, vos recettes et vos événements NAWO en un coup d'œil.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Tableau de bord organisateur — NAWO" },
      { property: "og:description", content: "Vos ventes et événements en un coup d'œil." },
    ],
  }),
  component: DashboardHome,
});

function DashboardHome() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: async () => {
      const [stats, events] = await Promise.all([organizerApi.dashboard(), organizerApi.events()]);
      return { ...stats, events };
    },
  });

  const revenue = Number(data?.revenue ?? 0);
  const currency = data?.events[0]?.currency ?? "XOF";

  const stats = [
    { label: "Recettes encaissées", value: formatPrice(revenue, currency), icon: Wallet },
    { label: "Commandes payées", value: String(data?.orders ?? 0), icon: Receipt },
    { label: "Billets émis", value: String(data?.tickets ?? 0), icon: Ticket },
    { label: "Entrées scannées", value: String(data?.used_tickets ?? 0), icon: CalendarDays },
  ];

  return (
    <DashboardShell title="Tableau de bord" description="Vue d'ensemble de votre billetterie.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card-surface p-5">
            <span className="bg-primary-soft mb-3 grid size-9 place-items-center rounded-lg text-primary">
              <stat.icon className="size-4" />
            </span>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-xl font-extrabold tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-9 flex items-end justify-between gap-4">
        <h2 className="text-lg font-bold tracking-tight">Vos événements</h2>
        <Button variant="outline" size="sm" asChild>
          <Link to="/dashboard/events">Tout voir</Link>
        </Button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {isLoading ? (
          <>
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </>
        ) : data?.events.length ? (
          data.events.slice(0, 6).map((event: any) => (
            <Link
              key={event.id}
              to="/dashboard/events/$id"
              params={{ id: event.id }}
              className="card-surface block p-5 transition-shadow hover:shadow-glow"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{event.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatDate(event.event_date, event.event_time)} · {event.location}
                  </p>
                </div>
                <Badge variant="secondary">{eventStatusLabel(event.status)}</Badge>
              </div>
            </Link>
          ))
        ) : (
          <div className="card-surface col-span-full p-10 text-center">
            <p className="font-semibold">Aucun événement pour le moment</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Créez votre premier événement et commencez à vendre en quelques minutes.
            </p>
            <Button className="mt-5" asChild>
              <Link to="/dashboard/events/create">
                <Plus className="size-4" />
                Créer un événement
              </Link>
            </Button>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
