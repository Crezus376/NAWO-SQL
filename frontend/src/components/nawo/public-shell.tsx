import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { NawoLogo } from "./logo";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";

export function PublicShell({ children }: { children: ReactNode }) {
  const { user } = useSession();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <NawoLogo />
          <nav className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/events">Événements</Link>
            </Button>
            {user ? (
              <Button size="sm" asChild>
                <Link to="/dashboard">Mon espace</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Connexion</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/register">Créer un compte</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border/70 py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-4 px-5 sm:flex-row sm:items-center sm:justify-between">
          <NawoLogo />
          <p className="text-sm text-muted-foreground">La billetterie simple, moderne et rapide.</p>
          <Link
            to="/scan/login"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Accès agents de scan
          </Link>
        </div>
      </footer>
    </div>
  );
}
