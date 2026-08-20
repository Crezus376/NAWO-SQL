import { supabase } from "@/integrations/supabase/client";

export const EVENT_STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  published: "Publié",
  ongoing: "En cours",
  completed: "Terminé",
  cancelled: "Annulé",
};

export const CUSTOM_PAGE_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  in_progress: "En conception",
  ready_for_preview: "Prête à prévisualiser",
  awaiting_payment: "En attente de paiement",
  paid: "Payée",
  active: "Active",
  revision_requested: "Révision demandée",
};

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export function formatPrice(amount: number | string, currency = "XOF") {
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (!value) return "Gratuit";
  return `${new Intl.NumberFormat("fr-FR").format(value)} ${currency}`;
}

export function formatDate(date: string, time?: string | null) {
  const d = new Date(`${date}T${time ?? "00:00:00"}`);
  const formatted = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
  if (!time) return formatted;
  return `${formatted} · ${time.slice(0, 5)}`;
}

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

/** Envoie une image et renvoie une URL signée longue durée. */
export async function uploadImage(bucket: "event-images" | "ticket-images", file: File) {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data, error: signError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, TEN_YEARS);
  if (signError) throw signError;
  return data.signedUrl;
}
