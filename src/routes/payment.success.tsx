import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { PublicShell } from "@/components/nawo/public-shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/payment/success")({
  validateSearch: (search: Record<string, unknown>): { ticket?: string } =>
    typeof search['ticket'] === "string" ? { ticket: search['ticket'] } : {},
  head: () => ({
    meta: [
      { title: "Paiement confirmé — NAWO" },
      { name: "description", content: "Votre paiement est confirmé et votre billet NAWO est généré." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Paiement confirmé — NAWO" },
      { property: "og:description", content: "Votre billet est généré." },
    ],
  }),
  component: PaymentSuccess,
});

function PaymentSuccess() {
  const { ticket } = useSearch({ from: "/payment/success" });

  return (
    <PublicShell>
      <div className="mx-auto max-w-md px-5 py-20 text-center">
        <span className="mx-auto mb-5 grid size-14 place-items-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="size-7" />
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight">Paiement confirmé</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Votre billet a été généré avec un QR code unique.
        </p>
        {ticket ? (
          <Button size="lg" className="mt-7 w-full" asChild>
            <Link to="/ticket/$id" params={{ id: ticket }}>
              Voir mon billet
            </Link>
          </Button>
        ) : (
          <Button size="lg" className="mt-7 w-full" asChild>
            <Link to="/events">Voir les événements</Link>
          </Button>
        )}
      </div>
    </PublicShell>
  );
}
