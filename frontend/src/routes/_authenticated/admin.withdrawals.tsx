import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { uploadFile } from "@/lib/api-client";
import { formatPrice, WITHDRAWAL_STATUS_LABELS } from "@/lib/nawo";
import { adminListWithdrawals, adminProcessWithdrawal } from "@/lib/withdrawals.functions";

export const Route = createFileRoute("/_authenticated/admin/withdrawals")({
  head: () => ({
    meta: [
      { title: "Demandes de retrait — Administration NAWO" },
      {
        name: "description",
        content:
          "Traitez les demandes de retrait des organisateurs : validation, preuve et référence.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Demandes de retrait — Administration NAWO" },
      { property: "og:description", content: "Validation des versements organisateurs." },
    ],
  }),
  component: AdminWithdrawals,
});

const STATUSES = ["pending", "processing", "paid", "rejected", "cancelled"] as const;

function AdminWithdrawals() {
  const queryClient = useQueryClient();
  const listFn = adminListWithdrawals;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-withdrawals"],
    queryFn: () => listFn({ data: undefined }),
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  if (!data?.length) {
    return (
      <div className="card-surface p-12 text-center">
        <p className="font-semibold">Aucune demande de retrait</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Les demandes des organisateurs apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((w) => (
        <WithdrawalCard
          key={w.id}
          withdrawal={w}
          onDone={() => queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] })}
        />
      ))}
    </div>
  );
}

type AdminWithdrawal = Awaited<ReturnType<typeof adminListWithdrawals>>[number];

function WithdrawalCard({
  withdrawal,
  onDone,
}: {
  withdrawal: AdminWithdrawal;
  onDone: () => void;
}) {
  const processFn = adminProcessWithdrawal;
  const [status, setStatus] = useState<string>(withdrawal.status);
  const [reference, setReference] = useState(withdrawal.transaction_reference ?? "");
  const [comment, setComment] = useState(withdrawal.admin_comment ?? "");
  const [proof, setProof] = useState<File | null>(null);

  const paid = withdrawal.status === "paid";

  const submit = useMutation({
    mutationFn: async () => {
      let proofPath: string | undefined;
      if (proof) {
        proofPath = (await uploadFile("withdrawal-proofs", proof)).path;
      }
      return processFn({
        data: {
          id: withdrawal.id,
          status: status as (typeof STATUSES)[number],
          ...(reference ? { reference } : {}),
          ...(comment ? { comment } : {}),
          ...(proofPath ? { proofPath } : {}),
        },
      });
    },
    onSuccess: (res) => {
      toast.success(
        res.notified
          ? "Demande mise à jour. Organisateur notifié par email."
          : "Demande mise à jour.",
      );
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="card-surface space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold">
            {withdrawal.organizer?.full_name ?? withdrawal.organizer?.email ?? "Organisateur"}
          </p>
          <p className="text-sm text-muted-foreground">
            {withdrawal.events?.name ?? "Tous les événements"} ·{" "}
            {new Date(withdrawal.created_at).toLocaleString("fr-FR")}
          </p>
        </div>
        <Badge variant={paid ? "default" : "secondary"}>
          {WITHDRAWAL_STATUS_LABELS[withdrawal.status] ?? withdrawal.status}
        </Badge>
      </div>

      <div className="grid gap-3 rounded-xl bg-muted p-4 text-sm sm:grid-cols-2">
        <Line label="Montant demandé" value={formatPrice(Number(withdrawal.amount_requested))} />
        <Line label="Frais NAWO (10 %)" value={formatPrice(Number(withdrawal.fee_amount))} />
        <Line label="Total débité" value={formatPrice(Number(withdrawal.total_debited))} />
        <Line label="Net à verser" value={formatPrice(Number(withdrawal.net_amount))} />
        <Line label="Moyen de paiement" value={withdrawal.payout_method} />
        <Line label="Coordonnées" value={withdrawal.payout_details} />
      </div>

      {withdrawal.organizer_note ? (
        <p className="text-sm text-muted-foreground">Note : {withdrawal.organizer_note}</p>
      ) : null}

      {withdrawal.proof_url ? (
        <a
          className="text-sm font-medium text-primary underline"
          href={withdrawal.proof_url}
          target="_blank"
          rel="noreferrer"
        >
          Preuve de paiement enregistrée
        </a>
      ) : null}

      {paid ? (
        <p className="text-sm text-muted-foreground">
          Retrait déjà payé le{" "}
          {withdrawal.processed_at
            ? new Date(withdrawal.processed_at).toLocaleString("fr-FR")
            : "—"}
          . Aucune nouvelle validation possible.
        </p>
      ) : (
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label>Statut</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {WITHDRAWAL_STATUS_LABELS[s] ?? s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`ref-${withdrawal.id}`}>Référence de transaction</Label>
            <Input
              id={`ref-${withdrawal.id}`}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`proof-${withdrawal.id}`}>Preuve de paiement</Label>
            <Input
              id={`proof-${withdrawal.id}`}
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setProof(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`comment-${withdrawal.id}`}>Commentaire</Label>
            <Textarea
              id={`comment-${withdrawal.id}`}
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={submit.isPending}>
              {submit.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Enregistrer
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
