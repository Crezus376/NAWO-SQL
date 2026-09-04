import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const FEE_RATE = 0.1;
export const MIN_WITHDRAWAL = 5000;

export type WithdrawalRow = {
  id: string;
  organizer_id: string;
  event_id: string | null;
  amount_requested: number;
  fee_amount: number;
  total_debited: number;
  net_amount: number;
  payout_method: string;
  payout_details: string;
  status: string;
  transaction_reference: string | null;
  proof_url: string | null;
  admin_comment: string | null;
  organizer_note: string | null;
  processed_at: string | null;
  created_at: string;
};

/** Frais NAWO : 10 % du montant demandé, arrondis à l'unité. */
export function computeFees(amountRequested: number) {
  const fee = Math.round(amountRequested * FEE_RATE);
  return {
    amountRequested,
    fee,
    totalDebited: amountRequested + fee,
    net: amountRequested,
  };
}

/** Répartition d'un solde total : le solde inclut les frais. */
export function splitFullBalance(balance: number) {
  const fee = Math.round(balance * FEE_RATE);
  return { amountRequested: balance - fee, fee, totalDebited: balance, net: balance - fee };
}

export async function getBalance(userId: string) {
  const { data, error } = await supabaseAdmin.rpc("organizer_balance", { _user_id: userId });
  if (error) throw error;
  return Number(data ?? 0);
}

export async function listOrganizerWithdrawals(userId: string) {
  const { data } = await supabaseAdmin
    .from("withdrawals")
    .select("*, events(name)")
    .eq("organizer_id", userId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

async function isAdmin(userId: string) {
  const { data } = await supabaseAdmin.rpc("has_role", { _user_id: userId, _role: "admin" });
  return Boolean(data);
}

export async function requireAdmin(userId: string) {
  if (!(await isAdmin(userId))) throw new Error("Accès réservé aux administrateurs.");
}

async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env["RESEND_API_KEY"];
  if (!key || !to) return { sent: false as const };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: process.env["NAWO_EMAIL_FROM"] ?? "NAWO <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
      }),
    });
    return { sent: res.ok as boolean };
  } catch {
    return { sent: false as const };
  }
}

function money(value: number) {
  return `${new Intl.NumberFormat("fr-FR").format(value)} FCFA`;
}

async function adminEmails() {
  const { data } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", "admin");
  const ids = (data ?? []).map((r) => r.user_id);
  if (ids.length === 0) return [];
  const { data: profiles } = await supabaseAdmin.from("profiles").select("email").in("id", ids);
  return (profiles ?? []).map((p) => p.email).filter((e): e is string => Boolean(e));
}

export type WithdrawalInput = {
  amount: number;
  fullBalance: boolean;
  payoutMethod: string;
  payoutDetails: string;
  eventId?: string | undefined;
  note?: string | undefined;
};

export async function createWithdrawal(userId: string, input: WithdrawalInput) {
  const balance = await getBalance(userId);
  const breakdown = input.fullBalance ? splitFullBalance(balance) : computeFees(input.amount);

  if (breakdown.amountRequested < MIN_WITHDRAWAL) {
    throw new Error(`Le montant minimum de retrait est de ${money(MIN_WITHDRAWAL)}.`);
  }
  if (breakdown.totalDebited > balance) {
    throw new Error(
      `Solde insuffisant : ${money(breakdown.totalDebited)} nécessaires (frais inclus) pour un solde de ${money(balance)}.`,
    );
  }

  if (input.eventId) {
    const { data: ev } = await supabaseAdmin
      .from("events")
      .select("id")
      .eq("id", input.eventId)
      .eq("organizer_id", userId)
      .maybeSingle();
    if (!ev) throw new Error("Événement introuvable.");
  }

  const { data: withdrawal, error } = await supabaseAdmin
    .from("withdrawals")
    .insert({
      organizer_id: userId,
      event_id: input.eventId ?? null,
      amount_requested: breakdown.amountRequested,
      fee_amount: breakdown.fee,
      total_debited: breakdown.totalDebited,
      net_amount: breakdown.net,
      payout_method: input.payoutMethod,
      payout_details: input.payoutDetails,
      organizer_note: input.note ?? null,
      status: "pending",
    })
    .select("*")
    .single();
  if (error) throw error;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .maybeSingle();
  const { data: event } = input.eventId
    ? await supabaseAdmin.from("events").select("name").eq("id", input.eventId).maybeSingle()
    : { data: null };

  const recipients = await adminEmails();
  const html = `
    <h2>Nouvelle demande de retrait NAWO</h2>
    <p><b>Organisateur :</b> ${profile?.full_name ?? profile?.email ?? userId}</p>
    <p><b>Événement :</b> ${event?.name ?? "Tous les événements"}</p>
    <p><b>Montant demandé :</b> ${money(breakdown.amountRequested)}</p>
    <p><b>Frais NAWO (10 %) :</b> ${money(breakdown.fee)}</p>
    <p><b>Total débité :</b> ${money(breakdown.totalDebited)}</p>
    <p><b>Montant net à verser :</b> ${money(breakdown.net)}</p>
    <p><b>Date :</b> ${new Date(withdrawal.created_at).toLocaleString("fr-FR")}</p>
    <p><a href="${process.env["NAWO_APP_URL"] ?? ""}/admin/withdrawals">Traiter la demande</a></p>`;
  let notified = false;
  for (const to of recipients) {
    const r = await sendEmail(to, "NAWO — Nouvelle demande de retrait", html);
    notified = notified || r.sent;
  }

  return { withdrawal, notified };
}

export async function listAllWithdrawals(userId: string) {
  await requireAdmin(userId);
  const { data } = await supabaseAdmin
    .from("withdrawals")
    .select("*, events(name, slug)")
    .order("created_at", { ascending: false });
  const rows = data ?? [];
  const ids = [...new Set(rows.map((r) => r.organizer_id))];
  const { data: profiles } = ids.length
    ? await supabaseAdmin.from("profiles").select("id, email, full_name").in("id", ids)
    : { data: [] };
  const map = new Map((profiles ?? []).map((p) => [p.id, p]));
  return rows.map((r) => ({ ...r, organizer: map.get(r.organizer_id) ?? null }));
}

export type ProcessInput = {
  id: string;
  status: "pending" | "processing" | "paid" | "rejected" | "cancelled";
  reference?: string | undefined;
  comment?: string | undefined;
  proofPath?: string | undefined;
};

export async function processWithdrawal(userId: string, input: ProcessInput) {
  await requireAdmin(userId);

  const { data: current } = await supabaseAdmin
    .from("withdrawals")
    .select("*")
    .eq("id", input.id)
    .maybeSingle();
  if (!current) throw new Error("Demande introuvable.");
  if (current.status === "paid") {
    throw new Error("Cette demande a déjà été payée : aucune nouvelle validation possible.");
  }

  let proofUrl = current.proof_url;
  if (input.proofPath) {
    const { data: signed } = await supabaseAdmin.storage
      .from("withdrawal-proofs")
      .createSignedUrl(input.proofPath, 60 * 60 * 24 * 365 * 10);
    proofUrl = signed?.signedUrl ?? proofUrl;
  }

  if (input.status === "paid" && !input.reference && !proofUrl) {
    throw new Error("Ajoutez une référence de transaction ou une preuve de paiement.");
  }

  const { data: updated, error } = await supabaseAdmin
    .from("withdrawals")
    .update({
      status: input.status,
      transaction_reference: input.reference ?? current.transaction_reference,
      admin_comment: input.comment ?? current.admin_comment,
      proof_url: proofUrl,
      processed_by: userId,
      processed_at: input.status === "paid" ? new Date().toISOString() : current.processed_at,
    })
    .eq("id", input.id)
    .eq("status", current.status)
    .select("*")
    .single();
  if (error) throw error;

  let notified = false;
  if (input.status === "paid") {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, full_name")
      .eq("id", updated.organizer_id)
      .maybeSingle();
    if (profile?.email) {
      const html = `
        <h2>Votre retrait NAWO a été payé</h2>
        <p>Bonjour ${profile.full_name ?? ""},</p>
        <p><b>Montant demandé :</b> ${money(Number(updated.amount_requested))}</p>
        <p><b>Frais NAWO (10 %) :</b> ${money(Number(updated.fee_amount))}</p>
        <p><b>Montant reçu :</b> ${money(Number(updated.net_amount))}</p>
        <p><b>Date du paiement :</b> ${new Date(updated.processed_at ?? Date.now()).toLocaleString("fr-FR")}</p>
        <p><b>Référence :</b> ${updated.transaction_reference ?? "—"}</p>
        <p><b>Statut :</b> Payé</p>
        ${updated.proof_url ? `<p><a href="${updated.proof_url}">Voir la preuve de paiement</a></p>` : ""}
        <p><a href="${process.env["NAWO_APP_URL"] ?? ""}/dashboard/withdrawals">Télécharger votre reçu NAWO</a></p>`;
      const r = await sendEmail(profile.email, "NAWO — Retrait payé", html);
      notified = r.sent;
    }
  }

  return { withdrawal: updated, notified };
}

export async function getWithdrawalReceipt(userId: string, withdrawalId: string) {
  const { data: w } = await supabaseAdmin
    .from("withdrawals")
    .select("*, events(name)")
    .eq("id", withdrawalId)
    .maybeSingle();
  if (!w) return null;
  if (w.organizer_id !== userId && !(await isAdmin(userId))) {
    throw new Error("Accès refusé.");
  }
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("email, full_name")
    .eq("id", w.organizer_id)
    .maybeSingle();
  return { withdrawal: w, organizer: profile };
}
