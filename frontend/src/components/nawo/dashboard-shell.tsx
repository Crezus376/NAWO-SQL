import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { LayoutDashboard, LogOut, Plus, Settings, Shield, Ticket, Wallet } from "lucide-react";
import { NawoLogo } from "./logo";
import { Button } from "@/components/ui/button";
import { useIsAdmin, useSession } from "@/hooks/use-session";
import { apiAuth } from "@/lib/api-client";

export function DashboardShell({
  children,
  title,
  description,
  action,
}: {
  children: ReactNode;
  title?: string | undefined;
  description?: string | undefined;
  action?: ReactNode | undefined;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSession();
  const isAdmin = useIsAdmin();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await apiAuth.logout();
    navigate({ to: "/login", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5">
          <NawoLogo to="/dashboard" subtitle="Organisateur" />
          <nav className="hidden items-center gap-1 md:flex">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard">
                <LayoutDashboard className="size-4" />
                Tableau de bord
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/events">
                <Ticket className="size-4" />
                Événements
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/withdrawals">
                <Wallet className="size-4" />
                Retraits
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/account">
                <Settings className="size-4" />
                Mon compte
              </Link>
            </Button>
            {isAdmin ? (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin">
                  <Shield className="size-4" />
                  Admin
                </Link>
              </Button>
            ) : null}
          </nav>
          <div className="flex items-center gap-2">
            <Button size="sm" asChild>
              <Link to="/dashboard/events/create">
                <Plus className="size-4" />
                <span className="hidden sm:inline">Nouvel événement</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Se déconnecter">
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-3 pb-2 md:hidden">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">Tableau de bord</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard/events">Événements</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard/withdrawals">Retraits</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/account">Mon compte</Link>
          </Button>
          {isAdmin ? (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin">Admin</Link>
            </Button>
          ) : null}
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8">
        {title ? (
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
              {description ? (
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
            {action}
          </div>
        ) : null}
        {children}
      </main>

      <footer className="border-t border-border/70 py-5 text-center text-xs text-muted-foreground">
        Connecté en tant que {user?.email ?? "—"}
      </footer>
    </div>
  );
}
