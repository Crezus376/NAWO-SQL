import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { uploadImage } from "@/lib/nawo";

export const Route = createFileRoute("/_authenticated/dashboard/events/$id/settings")({
  head: () => ({
    meta: [
      { title: "Paramètres de l'événement — NAWO" },
      {
        name: "description",
        content: "Modifiez les informations, le statut de publication et le visuel de votre événement.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Paramètres de l'événement — NAWO" },
      { property: "og:description", content: "Informations, publication et visuel." },
    ],
  }),
  component: EventSettingsPage,
});

function EventSettingsPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    description: "",
    event_date: "",
    event_time: "",
    location: "",
    status: "draft",
    page_mode: "standard",
  });
  const [cover, setCover] = useState<File | null>(null);

  const { data } = useQuery({
    queryKey: ["event-admin", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      name: data.name,
      description: data.description ?? "",
      event_date: data.event_date,
      event_time: data.event_time ?? "",
      location: data.location,
      status: data.status,
      page_mode: data.page_mode,
    });
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      let coverUrl = data?.cover_image_url ?? null;
      if (cover) coverUrl = await uploadImage("event-images", cover);
      const { error } = await supabase
        .from("events")
        .update({
          name: form.name,
          description: form.description || null,
          event_date: form.event_date,
          event_time: form.event_time || null,
          location: form.location,
          status: form.status as "draft" | "published" | "ongoing" | "completed" | "cancelled",
          page_mode: form.page_mode as "standard" | "custom",
          cover_image_url: coverUrl,
        })
        .eq("id", id);
      if (error) throw error;

      // Une demande de page personnalisée est créée automatiquement.
      if (form.page_mode === "custom") {
        const { data: existing } = await supabase
          .from("event_pages")
          .select("id")
          .eq("event_id", id)
          .maybeSingle();
        if (!existing) {
          const { error: pageError } = await supabase
            .from("event_pages")
            .insert({ event_id: id, mode: "custom", status: "pending" });
          if (pageError) throw pageError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-admin", id] });
      queryClient.invalidateQueries({ queryKey: ["event-page", id] });
      toast.success("Événement mis à jour.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { data: customPage } = useQuery({
    queryKey: ["event-page", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_pages")
        .select("*")
        .eq("event_id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const saveBrief = useMutation({
    mutationFn: async (brief: string) => {
      if (!customPage) return;
      const { error } = await supabase
        .from("event_pages")
        .update({ brief })
        .eq("id", customPage.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-page", id] });
      toast.success("Brief envoyé à l'équipe NAWO.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Événement supprimé.");
      navigate({ to: "/dashboard/events" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="max-w-2xl space-y-6">
      <form
        className="card-surface space-y-5 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="name">Nom</Label>
          <Input
            id="name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="desc">Description</Label>
          <Textarea
            id="desc"
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              required
              value={form.event_date}
              onChange={(e) => setForm({ ...form, event_date: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="time">Heure</Label>
            <Input
              id="time"
              type="time"
              value={form.event_time}
              onChange={(e) => setForm({ ...form, event_time: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="loc">Lieu</Label>
          <Input
            id="loc"
            required
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Statut</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="published">Publié</SelectItem>
                <SelectItem value="ongoing">En cours</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Type de page</Label>
            <Select
              value={form.page_mode}
              onValueChange={(v) => setForm({ ...form, page_mode: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="custom">Personnalisée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cover">Nouveau visuel</Label>
          <Input
            id="cover"
            type="file"
            accept="image/*"
            onChange={(e) => setCover(e.target.files?.[0] ?? null)}
          />
        </div>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Enregistrer
        </Button>
      </form>

      <div className="card-surface border-destructive/30 p-6">
        <h2 className="font-bold text-destructive">Zone sensible</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          La suppression de l'événement est définitive.
        </p>
        <Button variant="destructive" className="mt-4" onClick={() => remove.mutate()}>
          Supprimer l'événement
        </Button>
      </div>
    </div>
  );
}
