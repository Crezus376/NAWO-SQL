import { apiRequest } from "@/lib/api-client";

type Call<T> = { data: T };

export async function purchaseTicket({
  data,
}: Call<{
  slug: string;
  ticketTypeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | undefined;
  promoCode?: string | undefined;
  ref?: string | undefined;
}>) {
  return apiRequest<any>(`/api/events/${encodeURIComponent(data.slug)}/orders`, {
    method: "POST",
    body: JSON.stringify({
      slug: data.slug,
      ticket_type_id: data.ticketTypeId,
      idempotency_key: crypto.randomUUID(),
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone,
      promo_code: data.promoCode,
      ref: data.ref,
    }),
  });
}

export async function getTicket({ data }: Call<{ ticketId: string }>) {
  return apiRequest<any>(`/api/tickets/${data.ticketId}`);
}
export async function hostLogin({ data }: Call<{ code: string }>) {
  return apiRequest<any>("/api/scan/host-sessions", {
    method: "POST",
    body: JSON.stringify({ code: data.code }),
  });
}
export async function scanTicketFn({
  data,
}: Call<{ code: string; qrToken: string; sessionId?: string }>) {
  return apiRequest<any>("/api/scan/attempts", {
    method: "POST",
    body: JSON.stringify({ code: data.code, qr_token: data.qrToken, session_id: data.sessionId }),
  });
}
export async function scanStats({ data }: Call<{ code: string; sessionId?: string }>) {
  return apiRequest<any>("/api/scan/statistics", {
    method: "POST",
    body: JSON.stringify({ code: data.code, session_id: data.sessionId }),
  });
}
