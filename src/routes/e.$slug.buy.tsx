import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { PublicShell } from "@/components/nawo/public-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/nawo";
import { purchaseTicket } from "@/lib/nawo.functions";

export const Route = createFileRoute("/e/$slug/buy")({
  validateSearch: (search: Record<string, unknown>) => ({
    type: typeof search.type === "string" ? search.type : undefined,
    ref: typeof search.ref === "string" ? search.ref : undefined,
  }),
  head: ({ params }) => ({
    meta: [
      { title: `Acheter un billet — ${params.slug} — NAWO` },
      {
        name: "description",
        content: `Achetez votre billet pour ${params.slug} en moins d'une minute, sans créer de compte.`,
      },
      { property: "og:title", content: `Acheter un billet — ${params.slug}` },
      { property: "og:description", content: "Achat rapide, billet immédiat avec QR code." },
    ],
  }),
  component: BuyPage,
});

function BuyPage() {
  const { slug } = Route.useParams();
  const { type, ref } = useSearch({ from: "/e/$slug/buy" });
  const navigate = useNavigate();
  const buy = useServerFn(purchaseTicket);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data } = useQuery({
    queryKey: ["buy", slug, type],
    queryFn: async () => {
      const { data: event } = await supabase
        .from("events")
        .select("id, name, currency, slug")
        .eq("slug", slug)
        .maybeSingle();
      if (!event) return null;
      const { data: types } = await supabase
        .from("ticket_types")
        .select("*")
        .eq("event_id", event.id)
        .eq("is_active", true)
        .order("price");
      return { event, types: types ?? [] };
    },
  });

  const selected = data?.types.find((t) => t.id === type) ?? data?.types[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    try {
      const result = await buy({
        data: {
          slug,
          ticketTypeId: selected.id,
          firstName,
          lastName,
          email,
          phone: phone || undefined,
          promoCode: promoCode || undefined,
          ref: ref || undefined,
        },
      });
      navigate({ to: "/payment/success", search: { ticket: result.ticketId } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Le paiement a échoué.");
      navigate({ to: "/payment/failed", search: { slug } });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PublicShell>
      <div className="mx-auto w-full max-w-lg px-5 py-10">
        <Link
          to="/e/$slug"
          params={{ slug }}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="size-4" /> Retour à l'événement
        </Link>

        <h1 className="mt-5 text-2xl font-extrabold tracking-tight">Finaliser mon billet</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Un achat = un billet. Pas besoin de créer un compte.
        </p>

        <form onSubmit={handleSubmit} className="card-surface mt-6 space-y-4 p-5">
          {selected ? (
            <div className="bg-primary-soft rounded-xl p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {data?.event.name}
              </p>
              <p className="mt-1 flex items-center justify-between font-bold">
                <span>{selected.name}</span>
                <span>{formatPrice(selected.price, data?.event.currency ?? "XOF")}</span>
              </p>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email (réception du billet)</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Téléphone (optionnel)</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="promo">Code promo (optionnel)</Label>
            <Input
              id="promo"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={submitting || !selected}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Payer et recevoir mon billet
          </Button>

          <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" />
            Paiement sécurisé — billet généré immédiatement
          </p>
        </form>
      </div>
    </PublicShell>
  );
}
