import { uploadImage as uploadApiImage } from "@/lib/api-client";

export enum Currency {
  XOF = "XOF",
}

export const CURRENCY_LABELS: Record<Currency, string> = {
  [Currency.XOF]: "FCFA",
};

export function currencyLabel(value: string = Currency.XOF): string {
  return CURRENCY_LABELS[value as Currency] ?? value;
}

export enum EventStatus {
  Draft = "draft",
  Published = "published",
  Ongoing = "ongoing",
  Completed = "completed",
  Cancelled = "cancelled",
}

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  [EventStatus.Draft]: "Brouillon",
  [EventStatus.Published]: "Publié",
  [EventStatus.Ongoing]: "En cours",
  [EventStatus.Completed]: "Terminé",
  [EventStatus.Cancelled]: "Annulé",
};

export function isKnownEventStatus(value: string): value is EventStatus {
  return Object.values(EventStatus).includes(value as EventStatus);
}

export function eventStatusLabel(value: string): string {
  return isKnownEventStatus(value) ? EVENT_STATUS_LABELS[value] : "Statut indisponible";
}

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
  return `${new Intl.NumberFormat("fr-FR").format(value)} ${currencyLabel(currency)}`;
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
