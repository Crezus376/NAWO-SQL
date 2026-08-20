import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type PurchaseInput = {
  slug: string;
  ticketTypeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  promoCode?: string;
  ref?: string;
};

function randomToken(len = 24) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 40);
}

export async function computePrice(ticketPrice: number, promo: { discount_type: string; discount_value: number } | null) {
  if (!promo) return { amount: ticketPrice, discount: 0 };
  const discount =
    promo.discount_type === "percent"
      ? Math.round(ticketPrice * (Number(promo.discount_value) / 100))
      : Math.min(Number(promo.discount_value), ticketPrice);
  return { amount: Math.max(ticketPrice - discount, 0), discount };
}

export async function findPromo(eventId: string, code?: string) {
  if (!code) return null;
  const { data } = await supabaseAdmin
    .from("promo_codes")
    .select("*")
    .eq("event_id", eventId)
    .ilike("code", code.trim())
    .eq("is_active", true)
    .maybeSingle();
  if (!data) return null;
  const now = new Date();
  if (data.starts_at && new Date(data.starts_at) > now) return null;
  if (data.ends_at && new Date(data.ends_at) < now) return null;
  if (data.usage_limit != null && data.used_count >= data.usage_limit) return null;
  return data;
}

export async function createPaidOrder(input: PurchaseInput) {
  const { data: event, error: eventError } = await supabaseAdmin
    .from("events")
    .select("id, name, slug, status, currency")
    .eq("slug", input.slug)
    .maybeSingle();
  if (eventError) throw eventError;
  if (!event || !["published", "ongoing"].includes(event.status)) {
    throw new Error("Cet événement n'est pas disponible à la vente.");
  }

  const { data: ticketType } = await supabaseAdmin
    .from("ticket_types")
    .select("*")
    .eq("id", input.ticketTypeId)
    .eq("event_id", event.id)
    .maybeSingle();
  if (!ticketType || !ticketType.is_active) throw new Error("Type de billet introuvable.");
  if (ticketType.quantity > 0 && ticketType.sold >= ticketType.quantity) {
    throw new Error("Ce type de billet est épuisé.");
  }

  const promo = await findPromo(event.id, input.promoCode);
  const { amount, discount } = await computePrice(Number(ticketType.price), promo);

  let ambassadorId: string | null = null;
  if (input.ref) {
    const { data: amb } = await supabaseAdmin
      .from("ambassadors")
      .select("id")
      .eq("event_id", event.id)
      .ilike("ref_code", input.ref)
      .maybeSingle();
    ambassadorId = amb?.id ?? null;
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
      event_id: event.id,
      ticket_type_id: ticketType.id,
      ambassador_id: ambassadorId,
      promo_code_id: promo?.id ?? null,
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      phone: input.phone ?? null,
      amount,
      discount,
      status: "pending",
    })
    .select()
    .single();
  if (orderError) throw orderError;

  // Paiement : architecture prête pour un prestataire externe.
  // En V1, le paiement est confirmé immédiatement puis le billet est généré.
  const { data: payment } = await supabaseAdmin
    .from("payments")
    .insert({ order_id: order.id, provider: "manual", amount, status: "paid" })
    .select()
    .single();

  await supabaseAdmin.from("orders").update({ status: "paid" }).eq("id", order.id);

  const ticketNumber = `NAWO-${Date.now().toString(36).toUpperCase()}-${randomToken(4).toUpperCase()}`;
  const { data: ticket, error: ticketError } = await supabaseAdmin
    .from("tickets")
    .insert({
      order_id: order.id,
      event_id: event.id,
      ticket_type_id: ticketType.id,
      ticket_number: ticketNumber,
      qr_token: `${crypto.randomUUID()}.${randomToken(16)}`,
      holder_first_name: input.firstName,
      holder_last_name: input.lastName,
    })
    .select()
    .single();
  if (ticketError) throw ticketError;

  await supabaseAdmin
    .from("ticket_types")
    .update({ sold: ticketType.sold + 1 })
    .eq("id", ticketType.id);

  if (promo) {
    await supabaseAdmin
      .from("promo_codes")
      .update({ used_count: promo.used_count + 1 })
      .eq("id", promo.id);
  }

  return { ticketId: ticket.id, orderId: order.id, paymentId: payment?.id ?? null };
}

export async function loadTicket(ticketId: string) {
  const { data: ticket } = await supabaseAdmin
    .from("tickets")
    .select("id, ticket_number, qr_token, holder_first_name, holder_last_name, is_used, created_at, event_id, ticket_type_id")
    .eq("id", ticketId)
    .maybeSingle();
  if (!ticket) return null;

  const { data: event } = await supabaseAdmin
    .from("events")
    .select("name, slug, event_date, event_time, location, cover_image_url")
    .eq("id", ticket.event_id)
    .maybeSingle();
  const { data: ticketType } = await supabaseAdmin
    .from("ticket_types")
    .select("name, price, image_url")
    .eq("id", ticket.ticket_type_id)
    .maybeSingle();
  const { data: template } = await supabaseAdmin
    .from("ticket_templates")
    .select("image_url, qr_x, qr_y, qr_width, qr_height, status")
    .eq("ticket_type_id", ticket.ticket_type_id)
    .maybeSingle();

  return { ticket, event, ticketType, template };
}

export async function hostSignIn(code: string) {
  const { data: host } = await supabaseAdmin
    .from("hosts")
    .select("id, name, event_id, is_active")
    .eq("access_code", code.trim().toUpperCase())
    .maybeSingle();
  if (!host || !host.is_active) return null;
  const { data: event } = await supabaseAdmin
    .from("events")
    .select("name, slug")
    .eq("id", host.event_id)
    .maybeSingle();
  return { hostId: host.id, name: host.name, eventId: host.event_id, eventName: event?.name ?? "" };
}

export async function scanTicket(accessCode: string, qrToken: string) {
  const host = await hostSignIn(accessCode);
  if (!host) return { result: "unauthorized" as const };

  const { data: ticket } = await supabaseAdmin
    .from("tickets")
    .select("id, event_id, is_used, ticket_type_id, holder_first_name, holder_last_name, ticket_number")
    .eq("qr_token", qrToken.trim())
    .maybeSingle();

  if (!ticket || ticket.event_id !== host.eventId) {
    await supabaseAdmin.from("scans").insert({
      event_id: host.eventId,
      host_id: host.hostId,
      result: "invalid",
    });
    return { result: "invalid" as const };
  }

  const { data: ticketType } = await supabaseAdmin
    .from("ticket_types")
    .select("name")
    .eq("id", ticket.ticket_type_id)
    .maybeSingle();

  if (ticket.is_used) {
    await supabaseAdmin.from("scans").insert({
      event_id: host.eventId,
      host_id: host.hostId,
      ticket_id: ticket.id,
      result: "already_used",
    });
    return {
      result: "already_used" as const,
      ticketType: ticketType?.name ?? null,
      holder: `${ticket.holder_first_name} ${ticket.holder_last_name}`,
    };
  }

  await supabaseAdmin
    .from("tickets")
    .update({ is_used: true, used_at: new Date().toISOString() })
    .eq("id", ticket.id);
  await supabaseAdmin.from("scans").insert({
    event_id: host.eventId,
    host_id: host.hostId,
    ticket_id: ticket.id,
    result: "valid",
  });

  return {
    result: "valid" as const,
    ticketType: ticketType?.name ?? null,
    holder: `${ticket.holder_first_name} ${ticket.holder_last_name}`,
    ticketNumber: ticket.ticket_number,
  };
}

export async function scanCount(accessCode: string) {
  const host = await hostSignIn(accessCode);
  if (!host) return { count: 0, host: null };
  const { count } = await supabaseAdmin
    .from("scans")
    .select("id", { count: "exact", head: true })
    .eq("event_id", host.eventId)
    .eq("result", "valid");
  return { count: count ?? 0, host };
}
