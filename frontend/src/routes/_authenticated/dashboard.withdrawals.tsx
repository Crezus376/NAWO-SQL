import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FileText, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/nawo/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ValidatedForm } from "@/components/ui/validated-form";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { organizerApi } from "@/lib/api-domain";
import { formatPrice, WITHDRAWAL_STATUS_LABELS } from "@/lib/nawo";
import { getWithdrawalOverview, requestWithdrawal } from "@/lib/withdrawals.functions";

export const Route = createFileRoute("/_authenticated/dashboard/withdrawals")({
  head: () => ({
    meta: [
      { title: "Retraits — NAWO" },
      {
        name: "description",
        content: "Consultez votre solde disponible et demandez le retrait de vos recettes NAWO.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Retraits — NAWO" },
      { property: "og:description", content: "Solde, frais et historique de vos retraits." },
    ],
  }),
  component: WithdrawalsPage,
});

function WithdrawalsPage() {
  const queryClient = useQueryClient();
  const overviewFn = getWithdrawalOverview;
  const requestFn = requestWithdrawal;

  const [amount, setAmount] = useState("");
  const [full, setFull] = useState(false);
  const [method, setMethod] = useState("Mobile Money");
  const [details, setDetails] = useState("");
  const [eventId, setEventId] = useState("");
  const [note, setNote] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["withdrawal-overview"],
    queryFn: () => overviewFn({ data: undefined }),
  });

  const { data: events } = useQuery({
    queryKey: ["my-events-simple"],
    queryFn: async () => {
      return organizerApi.events();
    },
  });

  const balance = data?.balance ?? 0;

  const breakdown = useMemo(() => {
    if (full) {
      const fee = Math.round(balance * 0.1);
      return { requested: balance - fee, fee, total: balance, net: balance - fee };
    }
    const requested = Number(amount || 0);
    const fee = Math.round(requested * 0.1);
    return { requested, fee, total: requested + fee, net: requested };
  }, [amount, full, balance]);

  const submit = useMutation({
    mutationFn: async () =>
      requestFn({
        data: {
          amount: full ? 0 : Number(amount || 0),
          fullBalance: full,
          payoutMethod: method,
          payoutDetails: details,
          ...(eventId ? { eventId } : {}),
          ...(note ? { note } : {}),
        },
      }),
    onSuccess: (res) => {
      toast.success(
        res.notified
          ? "Demande envoyée. L'administrateur a été notifié par email."
          : "Demande enregistrée. Elle apparaît dans le tableau de bord administrateur.",
      );
      setAmount("");
      setFull(false);
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["withdrawal-overview"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const insufficient = breakdown.total > balance || breakdown.requested <= 0;

  return (
    <DashboardShell
      title="Retraits"
      description="Retirez vos recettes. NAWO prélève 10 % de frais sur chaque retrait."
    >
      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card-surface p-5">
              <span className="bg-primary-soft mb-3 grid size-9 place-items-center rounded-lg text-primary">
                <Wallet className="size-4" />
              </span>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Solde disponible
              </p>
              <p className="mt-1 text-xl font-extrabold tracking-tight">{formatPrice(balance)}</p>
            </div>
            <div className="card-surface p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Frais NAWO</p>
              <p className="mt-1 text-xl font-extrabold tracking-tight">10 %</p>
            </div>
            <div className="card-surface p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Retrait minimum
              </p>
              <p className="mt-1 text-xl font-extrabold tracking-tight">
                {formatPrice(data?.minimum ?? 5000)}
              </p>
            </div>
          </div>

          <ValidatedForm
            className="card-surface max-w-2xl space-y-5 p-6"
            onSubmit={(e) => {
              e.preventDefault();
              submit.mutate();
            }}
          >
            <h2 className="font-bold">Nouvelle demande de retrait</h2>

            <div className="flex items-center justify-between rounded-xl border border-border p-4">
              <div>
                <p className="text-sm font-medium">Retirer la totalité du solde</p>
                <p className="text-xs text-muted-foreground">
                  Le solde est débité en totalité, frais inclus.
                </p>
              </div>
              <Switch checked={full} onCheckedChange={setFull} />
            </div>

            {!full ? (
              <div className="space-y-1.5">
                <Label htmlFor="amount" required>
                  Montant à retirer
                </Label>
                <Input
                  id="amount"
                  type="number"
                  min={0}
                  step={100}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="method" required>
                  Moyen de paiement
                </Label>
                <Input
                  id="method"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="details" required>
                  Coordonnées de paiement
                </Label>
                <Input
                  id="details"
                  placeholder="Numéro / IBAN / bénéficiaire"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="event">Événement concerné (optionnel)</Label>
              <select
                id="event"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
              >
                <option value="">Tous mes événements</option>
                {(events ?? []).map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="note">Commentaire (optionnel)</Label>
              <Textarea id="note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            <div className="rounded-xl bg-muted p-4 text-sm">
              <p className="font-semibold">Récapitulatif</p>
              <p className="mt-2 text-muted-foreground">
                {full
                  ? `Vous demandez le retrait de la totalité de votre solde : ${formatPrice(balance)}.`
                  : `Vous demandez un retrait de ${formatPrice(breakdown.requested)}.`}
              </p>
              <p className="text-muted-foreground">
                Frais NAWO (10 %) : {formatPrice(breakdown.fee)}.
              </p>
              <p className="text-muted-foreground">
                Total déduit de votre solde : {formatPrice(breakdown.total)}.
              </p>
              <p className="font-semibold">Vous recevrez : {formatPrice(breakdown.net)}.</p>
              {insufficient && breakdown.requested > 0 ? (
                <p className="mt-2 font-medium text-destructive">
                  Solde insuffisant pour ce montant, frais compris.
                </p>
              ) : null}
            </div>

            <Button type="submit" size="lg" disabled={submit.isPending || insufficient}>
              {submit.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Demander le retrait
            </Button>
          </ValidatedForm>

          <div className="card-surface overflow-hidden">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-bold">Historique des retraits</h2>
            </div>
            {data?.withdrawals.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="hidden md:table-cell">Événement</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead className="hidden sm:table-cell">Frais</TableHead>
                    <TableHead>Reçu net</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.withdrawals.map((w: any) => (
                    <TableRow key={w.id}>
                      <TableCell>{new Date(w.created_at).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {w.events?.name ?? "Tous"}
                      </TableCell>
                      <TableCell>{formatPrice(Number(w.amount_requested))}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {formatPrice(Number(w.fee_amount))}
                      </TableCell>
                      <TableCell>{formatPrice(Number(w.net_amount))}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {WITHDRAWAL_STATUS_LABELS[w.status] ?? w.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {w.proof_url ? (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={w.proof_url} target="_blank" rel="noreferrer">
                                Preuve
                              </a>
                            </Button>
                          ) : null}
                          {w.status === "paid" ? (
                            <Button variant="ghost" size="sm" asChild>
                              <Link to="/dashboard/withdrawals/$id" params={{ id: w.id }}>
                                <FileText className="size-4" />
                                Reçu
                              </Link>
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="p-8 text-center text-sm text-muted-foreground">
                Aucun retrait pour l'instant.
              </p>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
