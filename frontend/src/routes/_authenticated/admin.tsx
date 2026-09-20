import {
  createFileRoute,
  Link,
  notFound,
  Outlet,
  redirect,
  useMatchRoute,
} from "@tanstack/react-router";
import { DashboardShell } from "@/components/nawo/dashboard-shell";
import { apiAuth } from "@/lib/api-client";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const user = await apiAuth.me();
    if (!user) throw redirect({ to: "/login" });
    if (!user.is_admin) throw notFound();
  },
  component: AdminLayout,
});

const TABS = [
  { to: "/admin", label: "Vue d'ensemble" },
  { to: "/admin/events", label: "Événements" },
  { to: "/admin/custom-pages", label: "Pages personnalisées" },
  { to: "/admin/templates", label: "Modèles de billets" },
  { to: "/admin/withdrawals", label: "Demandes de retrait" },
] as const;

function AdminLayout() {
  const matchRoute = useMatchRoute();

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
