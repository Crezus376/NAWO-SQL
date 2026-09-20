import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/nawo/dashboard-shell";
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
import { Currency, currencyLabel } from "@/lib/nawo";

export const Route = createFileRoute("/_authenticated/dashboard/events/create")({
  head: () => ({
    meta: [
      { title: "Créer un événement — NAWO" },
      {
        name: "description",
        content:
          "Créez un événement NAWO : date, lieu, visuel et page de vente en quelques champs.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Créer un événement — NAWO" },
      { property: "og:description", content: "Lancez votre billetterie en quelques champs." },
    ],
  }),
  component: CreateEventPage,
});

function CreateEventPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    event_date: "",
    event_time: "",
    location: "",
    page_mode: "standard",
    currency: Currency.XOF,
  });
  const [cover, setCover] = useState<File | null>(null);

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, value));
      if (cover) body.append("cover", cover);
      const data = await organizerApi.createEvent(body);

      toast.success("Événement créé. Ajoutez vos billets.");
      navigate({ to: "/dashboard/events/$id/tickets", params: { id: data.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Création impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardShell
      title="Nouvel événement"
      description="Les informations essentielles suffisent pour démarrer."
    >
      <ValidatedForm onSubmit={handleSubmit} className="card-surface max-w-2xl space-y-5 p-6">
        <div className="space-y-1.5">
          <Label htmlFor="name" required>
            Nom de l'événement
          </Label>
          <Input
            id="name"
            required
            maxLength={255}
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={4}
            maxLength={10000}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
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
              onChange={(e) => update("event_date", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="time">Heure</Label>
            <Input
              id="time"
              type="time"
              value={form.event_time}
              onChange={(e) => update("event_time", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="location" required>
            Lieu
          </Label>
          <Input
            id="location"
            required
            maxLength={255}
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Type de page</Label>
            <Select value={form.page_mode} onValueChange={(v) => update("page_mode", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Page standard (immédiate)</SelectItem>
                <SelectItem value="custom">Page personnalisée (sur devis)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="currency">Devise</Label>
            <Select value={form.currency} onValueChange={(v) => update("currency", v)}>
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Currency.XOF}>{currencyLabel(Currency.XOF)}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cover">Visuel de couverture</Label>
          <Input
            id="cover"
            type="file"
            accept="image/*"
            onChange={(e) => setCover(e.target.files?.[0] ?? null)}
          />
        </div>

        <Button type="submit" size="lg" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          Créer l'événement
        </Button>
      </ValidatedForm>
    </DashboardShell>
  );
}
