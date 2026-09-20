import { apiRequest } from "@/lib/api-client";

export type ApiRow = any;

function patchBody(body: FormData | ApiRow) {
  if (!(body instanceof FormData)) return { method: "PATCH", body: JSON.stringify(body) };
  body.set("_method", "PATCH");
  return { method: "POST", body };
}

export const publicApi = {
  events(limit?: number) {
    const query = limit ? `?limit=${encodeURIComponent(limit)}` : "";
    return apiRequest<ApiRow[]>(`/api/events${query}`);
  },
  event(slug: string) {
    return apiRequest<ApiRow>(`/api/events/${encodeURIComponent(slug)}`);
  },
};

export const organizerApi = {
  dashboard() {
    return apiRequest<ApiRow>("/api/organizer/dashboard");
  },
  events() {
    return apiRequest<ApiRow[]>("/api/organizer/events");
  },
  event(id: string) {
    return apiRequest<ApiRow>(`/api/organizer/events/${id}`);
  },
  createEvent(body: FormData | ApiRow) {
    return apiRequest<ApiRow>("/api/organizer/events", {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  },
  updateEvent(id: string, body: FormData | ApiRow) {
    return apiRequest<ApiRow>(`/api/organizer/events/${id}`, {
      ...patchBody(body),
    });
  },
  eventPage(id: string) {
    return apiRequest<ApiRow>(`/api/organizer/events/${id}/page`);
  },
  updateEventPage(id: string, body: ApiRow) {
    return apiRequest<ApiRow>(`/api/organizer/events/${id}/page`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },
  deleteEvent(id: string) {
    return apiRequest<void>(`/api/organizer/events/${id}`, { method: "DELETE" });
  },
  overview(id: string) {
    return apiRequest<ApiRow>(`/api/organizer/events/${id}/overview`);
  },
  sessions(id: string) {
    return apiRequest<ApiRow[]>(`/api/organizer/events/${id}/sessions`);
  },
  ticketTypes(id: string) {
    return apiRequest<ApiRow[]>(`/api/organizer/events/${id}/ticket-types`);
  },
  promos(id: string) {
    return apiRequest<ApiRow[]>(`/api/organizer/events/${id}/promo-codes`);
  },
  ambassadors(id: string) {
    return apiRequest<ApiRow[]>(`/api/organizer/events/${id}/ambassadors`);
  },
  hosts(id: string) {
    return apiRequest<ApiRow[]>(`/api/organizer/events/${id}/hosts`);
  },
  createResource(id: string, resource: string, body: FormData | ApiRow) {
    return apiRequest<ApiRow>(`/api/organizer/events/${id}/${resource}`, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  },
  updateResource(eventId: string, resource: string, id: string, body: FormData | ApiRow) {
    return apiRequest<ApiRow>(`/api/organizer/events/${eventId}/${resource}/${id}`, {
      ...patchBody(body),
    });
  },
  deleteResource(eventId: string, resource: string, id: string) {
    return apiRequest<void>(`/api/organizer/events/${eventId}/${resource}/${id}`, {
      method: "DELETE",
    });
  },
  withdrawals() {
    return apiRequest<ApiRow>("/api/organizer/withdrawals");
  },
  requestWithdrawal(body: ApiRow) {
    return apiRequest<ApiRow>("/api/organizer/withdrawals", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
};

export const adminApi = {
  overview() {
    return apiRequest<ApiRow>("/api/admin/dashboard");
  },
  events() {
    return apiRequest<ApiRow[]>("/api/admin/events");
  },
  event(id: string) {
    return apiRequest<ApiRow>(`/api/admin/events/${id}`);
  },
  pages() {
    return apiRequest<ApiRow[]>("/api/admin/event-pages");
  },
  updatePage(id: string, body: ApiRow) {
    return apiRequest<ApiRow>(`/api/admin/event-pages/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },
  templates() {
    return apiRequest<ApiRow[]>("/api/admin/ticket-templates");
  },
  ticketTypes() {
    return apiRequest<ApiRow[]>("/api/admin/ticket-types");
  },
  createTemplate(body: FormData | ApiRow) {
    return apiRequest<ApiRow>("/api/admin/ticket-templates", {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  },
  updateTemplate(id: string, body: FormData | ApiRow) {
    return apiRequest<ApiRow>(`/api/admin/ticket-templates/${id}`, {
      ...patchBody(body),
    });
  },
  withdrawals() {
    return apiRequest<ApiRow[]>("/api/admin/withdrawals");
  },
  processWithdrawal(id: string, body: FormData | ApiRow) {
    return apiRequest<ApiRow>(`/api/admin/withdrawals/${id}`, {
      ...patchBody(body),
    });
  },
};
