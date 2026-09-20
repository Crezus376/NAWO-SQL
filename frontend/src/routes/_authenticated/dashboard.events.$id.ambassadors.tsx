import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Copy, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ValidatedForm } from "@/components/ui/validated-form";
import { Progress } from "@/components/ui/progress";
import { organizerApi } from "@/lib/api-domain";
import { useEventStatus } from "@/hooks/use-event-status";

export const Route = createFileRoute("/_authenticated/dashboard/events/$id/ambassadors")({
  head: () => ({
    meta: [
      { title: "Ambassadeurs — NAWO" },
      {
        name: "description",
        content: "Donnez un lien de vente unique à chaque ambassadeur et suivez ses performances.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Ambassadeurs — NAWO" },
      { property: "og:description", content: "Liens de vente et objectifs par ambassadeur." },
    ],
  }),
  component: AmbassadorsPage,
});

function AmbassadorsPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const { isReadOnly } = useEventStatus(id);
  const [form, setForm] = useState({ name: "", ref_code: "", sales_goal: "" });

  const { data } = useQuery({
    queryKey: ["ambassadors", id],
    queryFn: async () => {
      const [list, event] = await Promise.all([
        organizerApi.ambassadors(id),
        organizerApi.event(id),
      ]);
      return { list, slug: event.slug ?? "" };
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      await organizerApi.createResource(id, "ambassadors", {
        name: form.name,
        ref_code: form.ref_code.toUpperCase(),
        sales_goal: Number(form.sales_goal || 0),
      });
    },
    onSuccess: () => {
      setForm({ name: "", ref_code: "", sales_goal: "" });
      queryClient.invalidateQueries({ queryKey: ["ambassadors", id] });
      toast.success("Ambassadeur ajouté.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (ambId: string) => {
      await organizerApi.deleteResource(id, "ambassadors", ambId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ambassadors", id] }),
  });

  function copyLink(refCode: string) {
    const url = `${window.location.origin}/e/${data?.slug}?ref=${refCode}`;
    void navigator.clipboard.writeText(url);
    toast.success("Lien copié.");
  }

  return (
    <fieldset disabled={isReadOnly} className="contents">
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          {data?.list.length ? (
            data.list.map((amb) => {
              const sold = Number(amb.sales_count ?? 0);
              const pct = amb.sales_goal ? Math.min(100, (sold / amb.sales_goal) * 100) : 0;
              return (
                <div key={amb.id} className="card-surface p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="font-bold">{amb.name}</p>
                      <p className="font-mono text-sm text-muted-foreground">{amb.ref_code}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => copyLink(amb.ref_code)}>
                      <Copy className="size-4" />
                      Lien
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove.mutate(amb.id)}
                      aria-label="Supprimer"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <div className="mt-3">
                    <Progress value={pct} />
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {sold} vente{sold > 1 ? "s" : ""}
                      {amb.sales_goal ? ` sur un objectif de ${amb.sales_goal}` : ""}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="card-surface p-10 text-center text-sm text-muted-foreground">
              Aucun ambassadeur. Ajoutez-en pour suivre les ventes par personne.
            </div>
          )}
        </div>

        <ValidatedForm
          className="card-surface h-fit space-y-4 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <h2 className="font-bold">Nouvel ambassadeur</h2>
          <div className="space-y-1.5">
            <Label htmlFor="aname" required>
              Nom
            </Label>
            <Input
              id="aname"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ref" required>
              Code de suivi
            </Label>
            <Input
              id="ref"
              required
              value={form.ref_code}
              onChange={(e) => setForm({ ...form, ref_code: e.target.value.toUpperCase() })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="goal">Objectif de ventes</Label>
            <Input
              id="goal"
              type="number"
              min={0}
              value={form.sales_goal}
              onChange={(e) => setForm({ ...form, sales_goal: e.target.value })}
            />
          </div>
          <Button type="submit" className="w-full">
            <Plus className="size-4" />
            Ajouter
          </Button>
        </ValidatedForm>
      </div>
    </fieldset>
  );
}
