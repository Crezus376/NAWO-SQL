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
import type { Database } from "@/integrations/supabase/types";
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
      values: Database["public"]["Tables"]["event_pages"]["Update"];
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
              onValueChange={(v) =>
                update.mutate({
                  pageId: page.id,
                  values: { status: v as Database["public"]["Enums"]["custom_page_status"] },
                })
              }
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
            {page.events?.slug ? (
              <Button variant="outline" size="sm" asChild className="ml-auto">
                <a href={`/e/${page.events.slug}`} target="_blank" rel="noreferrer">
                  Voir la page publique
                </a>
              </Button>
            ) : null}
          </div>

          <PageContentEditor
            content={parseCustomPageContent(page.content)}
            saving={update.isPending}
            onSave={(content) =>
              update.mutate({
                pageId: page.id,
                values: { content: content as unknown as Database["public"]["Tables"]["event_pages"]["Update"]["content"] },
              })
            }
          />
        </div>
      ))}
    </div>
  );
}

function PageContentEditor({
  content,
  saving,
  onSave,
}: {
  content: CustomPageContent;
  saving: boolean;
  onSave: (content: CustomPageContent) => void;
}) {
  const [draft, setDraft] = useState<CustomPageContent>(content);
  const [lineup, setLineup] = useState((content.lineup ?? []).map((a) => a.name).join(", "));
  const [highlights, setHighlights] = useState(
    (content.highlights ?? []).map((h) => `${h.title} | ${h.text}`).join("\n"),
  );

  function submit() {
    onSave({
      ...draft,
      lineup: lineup
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean)
        .map((name) => ({ name })),
      highlights: highlights
        .split("\n")
        .map((line) => line.split("|"))
        .filter((parts) => parts[0]?.trim())
        .map((parts) => ({ title: parts[0]!.trim(), text: (parts[1] ?? "").trim() })),
    });
  }

  return (
    <details className="rounded-xl border border-border p-4">
      <summary className="cursor-pointer text-sm font-semibold">Éditeur de la page</summary>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Thème</Label>
          <Select
            value={draft.theme ?? "gold"}
            onValueChange={(v) => setDraft({ ...draft, theme: v as CustomPageContent["theme"] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CUSTOM_PAGE_THEMES).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  {value.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Accroche (au-dessus du titre)</Label>
          <Input
            value={draft.tagline ?? ""}
            onChange={(e) => setDraft({ ...draft, tagline: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Titre</Label>
          <Input
            value={draft.headline ?? ""}
            onChange={(e) => setDraft({ ...draft, headline: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Sous-titre</Label>
          <Input
            value={draft.subheadline ?? ""}
            onChange={(e) => setDraft({ ...draft, subheadline: e.target.value })}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Image de fond (URL)</Label>
          <Input
            value={draft.heroImage ?? ""}
            onChange={(e) => setDraft({ ...draft, heroImage: e.target.value })}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Présentation</Label>
          <Textarea
            rows={4}
            value={draft.about ?? ""}
            onChange={(e) => setDraft({ ...draft, about: e.target.value })}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Points forts (une ligne par bloc : titre | texte)</Label>
          <Textarea rows={3} value={highlights} onChange={(e) => setHighlights(e.target.value)} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Line-up (noms séparés par des virgules)</Label>
          <Input value={lineup} onChange={(e) => setLineup(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Dress code</Label>
          <Input
            value={draft.dressCode ?? ""}
            onChange={(e) => setDraft({ ...draft, dressCode: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Texte du bouton</Label>
          <Input
            value={draft.ctaLabel ?? ""}
            onChange={(e) => setDraft({ ...draft, ctaLabel: e.target.value })}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Note d'information</Label>
          <Input
            value={draft.infoNote ?? ""}
            onChange={(e) => setDraft({ ...draft, infoNote: e.target.value })}
          />
        </div>
      </div>
      <Button className="mt-4" onClick={submit} disabled={saving}>
        Enregistrer la page
      </Button>
    </details>
  );
}
