import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { XCircle } from "lucide-react";
import { PublicShell } from "@/components/nawo/public-shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/payment/failed")({
  validateSearch: (search: Record<string, unknown>): { slug?: string } =>
    typeof search["slug"] === "string" ? { slug: search["slug"] } : {},
  head: () => ({
    meta: [
      { title: "Paiement non abouti — NAWO" },
      { name: "description", content: "Votre paiement n'a pas abouti. Vous pouvez réessayer." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Paiement non abouti — NAWO" },
      { property: "og:description", content: "Le paiement n'a pas abouti." },
    ],
  }),
  component: PaymentFailed,
});

function PaymentFailed() {
  const { slug } = useSearch({ from: "/payment/failed" });

  return (
    <PublicShell>
      <div className="mx-auto max-w-md px-5 py-20 text-center">
        <span className="mx-auto mb-5 grid size-14 place-items-center rounded-full bg-destructive/10 text-destructive">
          <XCircle className="size-7" />
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight">Paiement non abouti</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Aucun billet n'a été généré. Vous pouvez réessayer votre achat.
        </p>
        <Button size="lg" className="mt-7 w-full" asChild>
          {slug ? (
            <Link to="/e/$slug" params={{ slug }}>
              Réessayer
            </Link>
          ) : (
            <Link to="/events">Voir les événements</Link>
          )}
        </Button>
      </div>
    </PublicShell>
  );
}
