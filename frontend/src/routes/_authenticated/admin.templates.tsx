import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ValidatedForm } from "@/components/ui/validated-form";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiDb } from "@/lib/api-client";
import { uploadImage } from "@/lib/nawo";

export const Route = createFileRoute("/_authenticated/admin/templates")({
  head: () => ({
    meta: [
      { title: "Modèles de billets — Administration NAWO" },
      {
        name: "description",
        content:
          "Créez les visuels de billets et positionnez précisément le QR code sur chaque modèle.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Modèles de billets — Administration NAWO" },
      { property: "og:description", content: "Visuels de billets et position du QR code." },
    ],
  }),
  component: AdminTemplates,
});

function AdminTemplates() {
  const queryClient = useQueryClient();
  const [ticketTypeId, setTicketTypeId] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [pos, setPos] = useState({ qr_x: "100", qr_y: "100", qr_width: "180", qr_height: "180" });

  const { data: types } = useQuery({
    queryKey: ["admin-ticket-types"],
    queryFn: async () => {
      const { data, error } = await apiDb
        .from("ticket_types")
        .select("id, name, event_id, events(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: templates, isLoading } = useQuery({
    queryKey: ["admin-templates"],
    queryFn: async () => {
      const { data, error } = await apiDb
        .from("ticket_templates")
        .select("*, ticket_types(name), events(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const type = types?.find((t) => t.id === ticketTypeId);
      if (!type) throw new Error("Sélectionnez un type de billet");
      let imageUrl: string | null = null;
      if (image) imageUrl = await uploadImage("ticket-images", image);
      const { error } = await apiDb.from("ticket_templates").insert({
        event_id: type.event_id,
        ticket_type_id: type.id,
        image_url: imageUrl,
        qr_x: Number(pos.qr_x),
        qr_y: Number(pos.qr_y),
        qr_width: Number(pos.qr_width),
        qr_height: Number(pos.qr_height),
        status: "active",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setImage(null);
      setTicketTypeId("");
      queryClient.invalidateQueries({ queryKey: ["admin-templates"] });
      toast.success("Modèle enregistré.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await apiDb.from("ticket_templates").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-templates"] }),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-40 rounded-2xl" />
        ) : templates?.length ? (
          templates.map((tpl) => (
            <div key={tpl.id} className="card-surface flex items-center gap-4 p-4">
              {tpl.image_url ? (
                <img src={tpl.image_url} alt="" className="h-20 w-32 rounded-lg object-cover" />
              ) : (
                <div className="bg-primary-soft h-20 w-32 rounded-lg" />
              )}
              <div className="flex-1">
                <p className="font-bold">{tpl.events?.name ?? "Événement"}</p>
                <p className="text-sm text-muted-foreground">
                  {tpl.ticket_types?.name} · QR {tpl.qr_x}/{tpl.qr_y} · {tpl.qr_width}×
                  {tpl.qr_height}
                </p>
              </div>
              <Badge variant={tpl.status === "active" ? "default" : "secondary"}>
                {tpl.status === "active" ? "Actif" : "Brouillon"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  toggleStatus.mutate({
                    id: tpl.id,
                    status: tpl.status === "active" ? "draft" : "active",
                  })
                }
              >
                {tpl.status === "active" ? "Désactiver" : "Activer"}
              </Button>
            </div>
          ))
        ) : (
          <div className="card-surface p-10 text-center text-sm text-muted-foreground">
            Aucun modèle de billet.
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
        <h2 className="font-bold">Nouveau modèle</h2>
        <div className="space-y-1.5">
          <Label required>Type de billet</Label>
          <Select value={ticketTypeId} onValueChange={setTicketTypeId}>
            <SelectTrigger aria-required="true">
              <SelectValue placeholder="Choisir" />
            </SelectTrigger>
            <SelectContent>
              {(types ?? []).map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.events?.name} — {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tpl-img">Visuel du billet</Label>
          <Input
            id="tpl-img"
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              ["qr_x", "Position X"],
              ["qr_y", "Position Y"],
              ["qr_width", "Largeur QR"],
              ["qr_height", "Hauteur QR"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                type="number"
                value={pos[key]}
                onChange={(e) => setPos({ ...pos, [key]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <Button type="submit" className="w-full">
          <Plus className="size-4" />
          Enregistrer le modèle
        </Button>
      </ValidatedForm>
    </div>
  );
}
