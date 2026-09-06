import { uploadImage as uploadApiImage } from "@/lib/api-client";

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

export const WITHDRAWAL_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  processing: "En cours de traitement",
  paid: "Payé",
  rejected: "Refusé",
  cancelled: "Annulé",
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

export async function uploadImage(bucket: "event-images" | "ticket-images", file: File) {
  return uploadApiImage(bucket, file);
}
