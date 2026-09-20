import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarDays, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ValidatedForm } from "@/components/ui/validated-form";
import { Skeleton } from "@/components/ui/skeleton";
import { apiDb } from "@/lib/api-client";
import { formatDate } from "@/lib/nawo";
import { useEventStatus } from "@/hooks/use-event-status";

export const Route = createFileRoute("/_authenticated/dashboard/events/$id/sessions")({
  head: () => ({
    meta: [
      { title: "Journées de l'événement — NAWO" },
      {
        name: "description",
        content:
          "Organisez un événement sur plusieurs journées : date, horaires et lieu propres à chaque session.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Journées de l'événement — NAWO" },
      { property: "og:description", content: "Sessions multi-jours de votre événement." },
    ],
  }),
  component: SessionsPage,
});

const EMPTY = { name: "", date: "", start: "", end: "", location: "" };

function SessionsPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const { isReadOnly } = useEventStatus(id);
  const [form, setForm] = useState(EMPTY);

  const { data, isLoading } = useQuery({
    queryKey: ["event-sessions", id],
    queryFn: async () => {
      const { data, error } = await apiDb
        .from("event_sessions")
        .select("*")
        .eq("event_id", id)
        .order("sort_order")
        .order("session_date");
      if (error) throw error;
      return data;
    },
  });

  const createSession = useMutation({
    mutationFn: async () => {
      const { error } = await apiDb.from("event_sessions").insert({
        event_id: id,
        name: form.name,
        session_date: form.date,
        start_time: form.start || null,
        end_time: form.end || null,
        location: form.location || null,
        sort_order: data?.length ?? 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setForm(EMPTY);
      queryClient.invalidateQueries({ queryKey: ["event-sessions", id] });
      toast.success("Journée ajoutée.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await apiDb.from("event_sessions").delete().eq("id", sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-sessions", id] });
      toast.success("Journée supprimée.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <fieldset disabled={isReadOnly} className="contents">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-40 rounded-2xl" />
          ) : data?.length ? (
            data.map((session, index) => (
              <div key={session.id} className="card-surface flex items-center gap-4 p-4">
                <span className="bg-primary-soft grid size-11 shrink-0 place-items-center rounded-xl text-primary">
                  <CalendarDays className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">
                    Jour {index + 1} · {session.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(session.session_date, session.start_time)}
                    {session.end_time ? ` → ${session.end_time.slice(0, 5)}` : ""}
                  </p>
                  {session.location ? (
                    <p className="text-sm text-muted-foreground">{session.location}</p>
                  ) : null}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Supprimer la journée"
                  onClick={() => removeSession.mutate(session.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))
          ) : (
            <div className="card-surface p-10 text-center text-sm text-muted-foreground">
              Aucune journée. Ajoutez au moins une journée pour vendre des billets.
            </div>
          )}
        </div>

        <ValidatedForm
          className="card-surface h-fit space-y-4 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            createSession.mutate();
          }}
        >
          <h2 className="font-bold">Ajouter une journée</h2>
          <div className="space-y-1.5">
            <Label htmlFor="sname" required>
              Nom de la journée
            </Label>
            <Input
              id="sname"
              required
              placeholder="Soirée d'ouverture"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sdate" required>
              Date
            </Label>
            <Input
              id="sdate"
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sstart">Début</Label>
              <Input
                id="sstart"
                type="time"
                value={form.start}
                onChange={(e) => setForm({ ...form, start: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="send">Fin</Label>
              <Input
                id="send"
                type="time"
                value={form.end}
                onChange={(e) => setForm({ ...form, end: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sloc">Lieu spécifique (optionnel)</Label>
            <Input
              id="sloc"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <Button type="submit" className="w-full" disabled={createSession.isPending}>
            {createSession.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Ajouter la journée
          </Button>
        </ValidatedForm>
      </div>
    </fieldset>
  );
}
