import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ValidatedForm } from "@/components/ui/validated-form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { organizerApi } from "@/lib/api-domain";
import { CUSTOM_PAGE_STATUS_LABELS, EventStatus } from "@/lib/nawo";
import { useEventStatus } from "@/hooks/use-event-status";

export const Route = createFileRoute("/_authenticated/dashboard/events/$id/settings")({
  head: () => ({
    meta: [
      { title: "Paramètres de l'événement — NAWO" },
      {
        name: "description",
        content:
          "Modifiez les informations, le statut de publication et le visuel de votre événement.",
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
  const { isReadOnly } = useEventStatus(id);
  const [form, setForm] = useState({
    name: "",
    description: "",
    event_date: "",
    event_time: "",
    location: "",
    status: EventStatus.Draft,
    page_mode: "standard",
  });
  const [cover, setCover] = useState<File | null>(null);

  const { data } = useQuery({
    queryKey: ["event-admin", id],
    queryFn: async () => {
      return organizerApi.event(id);
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
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, value));
      if (cover) body.append("cover", cover);
      await organizerApi.updateEvent(id, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-admin", id] });
      queryClient.invalidateQueries({ queryKey: ["event-page", id] });
      toast.success("Événement mis à jour.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const customPage = data?.page ?? null;

  const saveBrief = useMutation({
    mutationFn: async (brief: string) => {
      if (!customPage) return;
      await organizerApi.updateEventPage(id, { brief });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-admin", id] });
      queryClient.invalidateQueries({ queryKey: ["event-page", id] });
      toast.success("Brief envoyé à l'équipe NAWO.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      await organizerApi.deleteEvent(id);
    },
    onSuccess: () => {
      toast.success("Événement supprimé.");
      navigate({ to: "/dashboard/events" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <fieldset disabled={isReadOnly} className="contents">
      <div className="max-w-2xl space-y-6">
        <ValidatedForm
          className="card-surface space-y-5 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="name" required>
              Nom
            </Label>
            <Input
              id="name"
              required
              maxLength={255}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              rows={4}
              maxLength={10000}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="date" required>
                Date
              </Label>
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
            <Label htmlFor="loc" required>
              Lieu
            </Label>
            <Input
              id="loc"
              required
              maxLength={255}
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Statut</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as EventStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EventStatus.Draft}>Brouillon</SelectItem>
                  <SelectItem value={EventStatus.Published}>Publié</SelectItem>
                  <SelectItem value={EventStatus.Ongoing}>En cours</SelectItem>
                  <SelectItem value={EventStatus.Completed}>Terminé</SelectItem>
                  <SelectItem value={EventStatus.Cancelled}>Annulé</SelectItem>
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
        </ValidatedForm>

        {customPage ? (
          <ValidatedForm
            className="card-surface space-y-3 p-6"
            onSubmit={(e) => {
              e.preventDefault();
              const brief = new FormData(e.currentTarget).get("brief");
              saveBrief.mutate(typeof brief === "string" ? brief : "");
            }}
          >
            <h2 className="font-bold">Page personnalisée</h2>
            <p className="text-sm text-muted-foreground">
              Statut :{" "}
              <span className="font-semibold text-foreground">
                {CUSTOM_PAGE_STATUS_LABELS[customPage.status] ?? customPage.status}
              </span>
              {customPage.is_active ? " · en ligne" : " · non publiée"}
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="brief">Votre brief créatif</Label>
              <Textarea
                id="brief"
                name="brief"
                rows={4}
                defaultValue={customPage.brief ?? ""}
                placeholder="Ambiance, couleurs, line-up, dress code, informations à mettre en avant…"
              />
            </div>
            <Button type="submit" variant="outline" disabled={saveBrief.isPending}>
              Envoyer le brief
            </Button>
          </ValidatedForm>
        ) : null}

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
    </fieldset>
  );
}
