import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Copy, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ValidatedForm } from "@/components/ui/validated-form";
import { Switch } from "@/components/ui/switch";
import { apiDb } from "@/lib/api-client";
import { useEventStatus } from "@/hooks/use-event-status";

export const Route = createFileRoute("/_authenticated/dashboard/events/$id/hosts")({
  head: () => ({
    meta: [
      { title: "Agents de scan — NAWO" },
      {
        name: "description",
        content:
          "Créez des codes d'accès pour vos agents et contrôlez les entrées depuis un mobile.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Agents de scan — NAWO" },
      { property: "og:description", content: "Codes d'accès pour le contrôle des entrées." },
    ],
  }),
  component: HostsPage,
});

function randomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function HostsPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const { isReadOnly } = useEventStatus(id);
  const [name, setName] = useState("");

  const { data } = useQuery({
    queryKey: ["hosts", id],
    queryFn: async () => {
      const { data, error } = await apiDb
        .from("hosts")
        .select("*")
        .eq("event_id", id)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await apiDb
        .from("hosts")
        .insert({ event_id: id, name, access_code: randomCode() });
      if (error) throw error;
    },
    onSuccess: () => {
      setName("");
      queryClient.invalidateQueries({ queryKey: ["hosts", id] });
      toast.success("Agent créé.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ hostId, active }: { hostId: string; active: boolean }) => {
      const { error } = await apiDb.from("hosts").update({ is_active: active }).eq("id", hostId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hosts", id] }),
  });

  const remove = useMutation({
    mutationFn: async (hostId: string) => {
      const { error } = await apiDb.from("hosts").delete().eq("id", hostId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hosts", id] }),
  });

  return (
    <fieldset disabled={isReadOnly} className="contents">
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          {data?.length ? (
            data.map((host) => (
              <div key={host.id} className="card-surface flex items-center gap-4 p-4">
                <div className="flex-1">
                  <p className="font-bold">{host.name}</p>
                  <p className="font-mono text-sm tracking-[0.2em] text-muted-foreground">
                    {host.access_code}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard.writeText(host.access_code);
                    toast.success("Code copié.");
                  }}
                >
                  <Copy className="size-4" />
                </Button>
                <Switch
                  checked={host.is_active}
                  onCheckedChange={(v) => toggle.mutate({ hostId: host.id, active: v })}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove.mutate(host.id)}
                  aria-label="Supprimer"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))
          ) : (
            <div className="card-surface p-10 text-center text-sm text-muted-foreground">
              Aucun agent. Créez un code d'accès pour scanner les billets à l'entrée.
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
          <h2 className="font-bold">Nouvel agent</h2>
          <div className="space-y-1.5">
            <Label htmlFor="hname" required>
              Nom de l'agent
            </Label>
            <Input id="hname" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <p className="text-xs text-muted-foreground">
            Un code d'accès unique est généré automatiquement. L'agent l'utilise sur la page de
            scan.
          </p>
          <Button type="submit" className="w-full">
            <Plus className="size-4" />
            Créer l'agent
          </Button>
        </ValidatedForm>
      </div>
    </fieldset>
  );
}
