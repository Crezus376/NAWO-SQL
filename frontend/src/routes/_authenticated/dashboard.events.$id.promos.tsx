import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiDb } from "@/lib/api-client";
import { useEventStatus } from "@/hooks/use-event-status";

export const Route = createFileRoute("/_authenticated/dashboard/events/$id/promos")({
  head: () => ({
    meta: [
      { title: "Codes promo — NAWO" },
      {
        name: "description",
        content:
          "Créez des codes promo en pourcentage ou en montant fixe et suivez leur utilisation.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Codes promo — NAWO" },
      { property: "og:description", content: "Réductions et suivi d'utilisation." },
    ],
  }),
  component: PromosPage,
});

function PromosPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const { isReadOnly } = useEventStatus(id);
  const [form, setForm] = useState({
    code: "",
    discount_type: "percent",
    discount_value: "",
    usage_limit: "",
  });

  const { data } = useQuery({
    queryKey: ["promos", id],
    queryFn: async () => {
      const { data, error } = await apiDb
        .from("promo_codes")
        .select("*")
        .eq("event_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await apiDb.from("promo_codes").insert({
        event_id: id,
        code: form.code.toUpperCase(),
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value || 0),
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setForm({ code: "", discount_type: "percent", discount_value: "", usage_limit: "" });
      queryClient.invalidateQueries({ queryKey: ["promos", id] });
      toast.success("Code promo créé.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ promoId, active }: { promoId: string; active: boolean }) => {
      const { error } = await apiDb
        .from("promo_codes")
        .update({ is_active: active })
        .eq("id", promoId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["promos", id] }),
  });

  const remove = useMutation({
    mutationFn: async (promoId: string) => {
      const { error } = await apiDb.from("promo_codes").delete().eq("id", promoId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["promos", id] }),
  });

  return (
    <fieldset disabled={isReadOnly} className="contents">
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          {data?.length ? (
            data.map((promo) => (
              <div key={promo.id} className="card-surface flex items-center gap-4 p-4">
                <div className="flex-1">
                  <p className="font-mono font-bold">{promo.code}</p>
                  <p className="text-sm text-muted-foreground">
                    -{promo.discount_value}
                    {promo.discount_type === "percent" ? "%" : ""} · {promo.used_count}
                    {promo.usage_limit ? `/${promo.usage_limit}` : ""} utilisations
                  </p>
                </div>
                <Switch
                  checked={promo.is_active}
                  onCheckedChange={(v) => toggle.mutate({ promoId: promo.id, active: v })}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove.mutate(promo.id)}
                  aria-label="Supprimer"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))
          ) : (
            <div className="card-surface p-10 text-center text-sm text-muted-foreground">
              Aucun code promo pour cet événement.
            </div>
          )}
        </div>

        <form
          className="card-surface h-fit space-y-4 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <h2 className="font-bold">Nouveau code promo</h2>
          <div className="space-y-1.5">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              required
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Type de remise</Label>
            <Select
              value={form.discount_type}
              onValueChange={(v) => setForm({ ...form, discount_type: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">Pourcentage</SelectItem>
                <SelectItem value="amount">Montant fixe</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="value">Valeur</Label>
              <Input
                id="value"
                type="number"
                min={0}
                required
                value={form.discount_value}
                onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="limit">Limite</Label>
              <Input
                id="limit"
                type="number"
                min={1}
                value={form.usage_limit}
                onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
              />
            </div>
          </div>
          <Button type="submit" className="w-full">
            <Plus className="size-4" />
            Créer le code
          </Button>
        </form>
      </div>
    </fieldset>
  );
}
