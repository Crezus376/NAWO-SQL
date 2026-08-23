import { createFileRoute, Link, Outlet, useMatchRoute } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { DashboardShell } from "@/components/nawo/dashboard-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsAdmin, useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const TABS = [
  { to: "/admin", label: "Vue d'ensemble" },
  { to: "/admin/events", label: "Événements" },
  { to: "/admin/custom-pages", label: "Pages personnalisées" },
  { to: "/admin/templates", label: "Modèles de billets" },
] as const;

function AdminLayout() {
  const isAdmin = useIsAdmin();
  const { loading } = useSession();
  const matchRoute = useMatchRoute();

  if (loading) {
    return (
      <DashboardShell title="Administration">
        <Skeleton className="h-64 w-full rounded-2xl" />
      </DashboardShell>
    );
  }

  if (!isAdmin) {
    return (
      <DashboardShell title="Administration">
        <div className="card-surface p-12 text-center">
          <span className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="size-6" />
          </span>
          <p className="font-semibold">Accès réservé aux administrateurs</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Votre compte n'a pas les droits nécessaires pour cette section.
          </p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Administration" description="Pilotage de la plateforme NAWO.">
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-muted p-1">
        {TABS.map((tab) => {
          const active = Boolean(matchRoute({ to: tab.to, fuzzy: tab.to !== "/admin" }));
          return (
            <Link
              key={tab.to}
              to={tab.to}
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
