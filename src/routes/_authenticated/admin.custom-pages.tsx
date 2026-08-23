import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { CUSTOM_PAGE_STATUS_LABELS } from "@/lib/nawo";

export const Route = createFileRoute("/_authenticated/admin/custom-pages")({
  head: () => ({
    meta: [
      { title: "Pages personnalisées — Administration NAWO" },
      {
        name: "description",
        content: "Suivez les demandes de pages événementielles personnalisées, du brief à la mise en ligne.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Pages personnalisées — Administration NAWO" },
      { property: "og:description", content: "Du brief à la mise en ligne." },
    ],
  }),
  component: AdminCustomPages,
});

const STATUSES = [
  "pending",
  "in_progress",
  "ready_for_preview",
  "awaiting_payment",
  "paid",
  "active",
  "revision_requested",
] as const;

function AdminCustomPages() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-custom-pages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_pages")
        .select("*, events(name, slug)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const update = useMutation({
    mutationFn: async ({
      pageId,
      values,
    }: {
      pageId: string;
      values: Record<string, unknown>;
    }) => {
      const { error } = await supabase.from("event_pages").update(values).eq("id", pageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-custom-pages"] });
      toast.success("Page mise à jour.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  if (!data?.length) {
    return (
      <div className="card-surface p-12 text-center text-sm text-muted-foreground">
        Aucune demande de page personnalisée.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((page) => (
        <div key={page.id} className="card-surface space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold">{page.events?.name ?? "Événement"}</p>
              <p className="text-sm text-muted-foreground">{page.brief ?? "Aucun brief fourni."}</p>
            </div>
            <Badge variant="secondary">
              {CUSTOM_PAGE_STATUS_LABELS[page.status] ?? page.status}
            </Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Select
              value={page.status}
              onValueChange={(v) => update.mutate({ pageId: page.id, values: { status: v } })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {CUSTOM_PAGE_STATUS_LABELS[s] ?? s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              defaultValue={page.preview_url ?? ""}
              placeholder="Lien d'aperçu"
              onBlur={(e) =>
                update.mutate({ pageId: page.id, values: { preview_url: e.target.value || null } })
              }
            />

            <Input
              type="number"
              defaultValue={page.price_amount ?? ""}
              placeholder="Montant"
              onBlur={(e) =>
                update.mutate({
                  pageId: page.id,
                  values: { price_amount: e.target.value ? Number(e.target.value) : null },
                })
              }
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={page.is_active}
              onCheckedChange={(v) => update.mutate({ pageId: page.id, values: { is_active: v } })}
            />
            <span className="text-sm text-muted-foreground">Page active sur le site public</span>
            {page.preview_url ? (
              <Button variant="outline" size="sm" asChild className="ml-auto">
                <a href={page.preview_url} target="_blank" rel="noreferrer">
                  Voir l'aperçu
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
