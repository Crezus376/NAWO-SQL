import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Printer } from "lucide-react";
import { DashboardShell } from "@/components/nawo/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/nawo";
import { getReceipt } from "@/lib/withdrawals.functions";

export const Route = createFileRoute("/_authenticated/dashboard/withdrawals/$id")({
  head: () => ({
    meta: [
      { title: "Reçu de retrait — NAWO" },
      {
        name: "description",
        content:
          "Reçu officiel NAWO détaillant le montant, les frais et le versement de votre retrait.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Reçu de retrait — NAWO" },
      { property: "og:description", content: "Document justificatif de votre versement." },
    ],
  }),
  component: ReceiptPage,
});

function ReceiptPage() {
  const { id } = Route.useParams();
  const receiptFn = getReceipt;

  const { data, isLoading } = useQuery({
    queryKey: ["withdrawal-receipt", id],
    queryFn: () => receiptFn({ data: { id } }),
  });

  if (isLoading) {
    return (
      <DashboardShell title="Reçu de retrait">
        <Skeleton className="h-96 w-full rounded-2xl" />
      </DashboardShell>
    );
  }

  if (!data) {
    return (
      <DashboardShell title="Reçu de retrait">
        <p className="card-surface p-12 text-center text-sm text-muted-foreground">
          Document introuvable.
        </p>
      </DashboardShell>
    );
  }

  const w = data.withdrawal;

  return (
    <DashboardShell
      title="Reçu de retrait"
      action={
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="size-4" />
          Imprimer / PDF
        </Button>
      }
    >
      <div className="card-surface mx-auto max-w-2xl space-y-6 p-8">
        <div className="flex items-start justify-between border-b border-border pb-5">
          <div>
            <p className="text-2xl font-extrabold tracking-tight">NAWO</p>
            <p className="text-sm text-muted-foreground">
              Plateforme de billetterie événementielle
            </p>
            <p className="text-sm text-muted-foreground">support@nawo.app</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">Reçu de versement</p>
            <p className="text-muted-foreground">N° {w.id.slice(0, 8).toUpperCase()}</p>
            <p className="text-muted-foreground">
              {new Date(w.processed_at ?? w.created_at).toLocaleDateString("fr-FR")}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Organisateur</p>
          <p className="font-semibold">{data.organizer?.full_name ?? "—"}</p>
          <p className="text-sm text-muted-foreground">{data.organizer?.email ?? "—"}</p>
        </div>

        <div className="grid gap-2 text-sm">
          <Row label="Événement" value={w.events?.name ?? "Tous les événements"} />
          <Row label="Moyen de paiement" value={w.payout_method} />
          <Row label="Coordonnées" value={w.payout_details} />
          <Row label="Référence de transaction" value={w.transaction_reference ?? "—"} />
          <Row label="Statut" value={w.status} />
        </div>

        <div className="space-y-2 rounded-xl bg-muted p-5 text-sm">
          <Row label="Montant du retrait" value={formatPrice(Number(w.amount_requested))} />
          <Row label="Frais NAWO (10 %)" value={formatPrice(Number(w.fee_amount))} />
          <Row label="Montant total débité" value={formatPrice(Number(w.total_debited))} />
          <div className="flex items-center justify-between border-t border-border pt-2 font-bold">
            <span>Montant versé à l'organisateur</span>
            <span>{formatPrice(Number(w.net_amount))}</span>
          </div>
        </div>

        {w.proof_url ? (
          <a
            className="text-sm font-medium text-primary underline"
            href={w.proof_url}
            target="_blank"
            rel="noreferrer"
          >
            Voir la preuve de paiement
          </a>
        ) : null}

        <p className="text-xs text-muted-foreground">
          Document généré automatiquement par NAWO. Aucun cachet n'est nécessaire.
        </p>
      </div>
    </DashboardShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
