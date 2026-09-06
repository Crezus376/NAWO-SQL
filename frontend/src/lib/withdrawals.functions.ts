import { apiRequest } from "@/lib/api-client";

type Call<T> = { data: T };

export async function getWithdrawalOverview(_call?: Call<undefined>) {
  return apiRequest<any>("/api/withdrawals");
}
export async function requestWithdrawal({
  data,
}: Call<{
  amount: number;
  fullBalance: boolean;
  payoutMethod: string;
  payoutDetails: string;
  eventId?: string;
  note?: string;
}>) {
  return apiRequest<any>("/api/withdrawals", {
    method: "POST",
    body: JSON.stringify({
      amount: data.amount,
      full_balance: data.fullBalance,
      payout_method: data.payoutMethod,
      payout_details: data.payoutDetails,
      event_id: data.eventId,
      note: data.note,
    }),
  });
}
export async function adminListWithdrawals(_call?: Call<undefined>) {
  return apiRequest<any[]>("/api/admin/withdrawals");
}
export async function adminProcessWithdrawal({
  data,
}: Call<{ id: string; status: string; reference?: string; comment?: string; proofPath?: string }>) {
  return apiRequest<any>(`/api/admin/withdrawals/${data.id}`, {
    method: "POST",
    body: JSON.stringify({
      status: data.status,
      reference: data.reference,
      comment: data.comment,
      proof_path: data.proofPath,
    }),
  });
}
export async function getReceipt({ data }: Call<{ id: string }>) {
  return apiRequest<any>(`/api/withdrawals/${data.id}/receipt`);
}
