import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatPrice, uploadImage } from "@/lib/nawo";

export const Route = createFileRoute("/_authenticated/dashboard/events/$id/tickets")({
  head: () => ({
    meta: [
      { title: "Types de billets — NAWO" },
      {
        name: "description",
        content:
          "Créez plusieurs catégories de billets avec prix, quotas, visuels et journées d'accès.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Types de billets — NAWO" },
      { property: "og:description", content: "Prix, quotas, journées et visuels de vos billets." },
    ],
  }),
  component: TicketTypesPage,
});

function TicketTypesPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", price: "", quantity: "", description: "" });
  const [image, setImage] = useState<File | null>(null);
  const [sessionIds, setSessionIds] = useState<string[]>([]);

  const { data: sessions } = useQuery({
    queryKey: ["event-sessions", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_sessions")
        .select("*")
        .eq("event_id", id)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["ticket-types", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ticket_types")
        .select("*, ticket_type_sessions(session_id, event_sessions(name, session_date))")
        .eq("event_id", id)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const createType = useMutation({
    mutationFn: async () => {
      let imageUrl: string | null = null;
      if (image) imageUrl = await uploadImage("ticket-images", image);
      const { data: created, error } = await supabase
        .from("ticket_types")
        .insert({
          event_id: id,
          name: form.name,
          price: Number(form.price || 0),
          quantity: Number(form.quantity || 0),
          description: form.description || null,
          image_url: imageUrl,
        })
        .select("id")
        .single();
      if (error) throw error;

      const targets = sessionIds.length > 0 ? sessionIds : (sessions ?? []).map((s) => s.id);
      if (targets.length > 0) {
        const { error: linkError } = await supabase
          .from("ticket_type_sessions")
          .insert(targets.map((session_id) => ({ ticket_type_id: created.id, session_id })));
        if (linkError) throw linkError;
      }
    },
    onSuccess: () => {
      setForm({ name: "", price: "", quantity: "", description: "" });
      setImage(null);
      setSessionIds([]);
      queryClient.invalidateQueries({ queryKey: ["ticket-types", id] });
      toast.success("Type de billet ajouté.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeType = useMutation({
    mutationFn: async (typeId: string) => {
      const { error } = await supabase.from("ticket_types").delete().eq("id", typeId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ticket-types", id] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-40 rounded-2xl" />
        ) : data?.length ? (
          data.map((type) => (
            <div key={type.id} className="card-surface flex items-center gap-4 p-4">
              {type.image_url ? (
                <img
                  src={type.image_url}
                  alt=""
                  className="size-16 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="bg-primary-soft size-16 shrink-0 rounded-xl" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-bold">{type.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatPrice(type.price)} · {type.sold}/{type.quantity} vendus
                </p>
                {type.description ? (
                  <p className="line-clamp-1 text-sm text-muted-foreground">{type.description}</p>
                ) : null}
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {type.ticket_type_sessions?.length ? (
                    type.ticket_type_sessions.map((link) => (
                      <Badge key={link.session_id} variant="secondary" className="text-[11px]">
                        {link.event_sessions?.name ?? "Journée"}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline" className="text-[11px]">
                      Aucune journée liée
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeType.mutate(type.id)}
                aria-label="Supprimer"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))
        ) : (
          <div className="card-surface p-10 text-center text-sm text-muted-foreground">
            Aucun type de billet. Ajoutez-en un pour ouvrir la vente.
          </div>
        )}
      </div>

      <form
        className="card-surface h-fit space-y-4 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          createType.mutate();
        }}
      >
        <h2 className="font-bold">Ajouter un type de billet</h2>
        <div className="space-y-1.5">
          <Label htmlFor="tname">Nom</Label>
          <Input
            id="tname"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="price">Prix</Label>
            <Input
              id="price"
              type="number"
              min={0}
              required
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qty">Quantité</Label>
            <Input
              id="qty"
              type="number"
              min={1}
              required
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tdesc">Description</Label>
          <Textarea
            id="tdesc"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Journées incluses</Label>
          {sessions?.length ? (
            sessions.map((session) => (
              <label
                key={session.id}
                className="flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground"
              >
                <Checkbox
                  checked={sessionIds.includes(session.id)}
                  onCheckedChange={(checked) =>
                    setSessionIds((prev) =>
                      checked ? [...prev, session.id] : prev.filter((s) => s !== session.id),
                    )
                  }
                />
                <span>
                  {session.name} · {formatDate(session.session_date, session.start_time)}
                </span>
              </label>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">
              Aucune journée créée : le billet donnera accès à toutes les journées ajoutées plus
              tard.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Sans sélection, toutes les journées existantes sont incluses (pass complet).
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="timg">Visuel du billet</Label>
          <Input
            id="timg"
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] ?? null)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={createType.isPending}>
          {createType.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          Ajouter
        </Button>
      </form>
    </div>
  );
}
