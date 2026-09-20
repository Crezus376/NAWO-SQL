import { apiRequest } from "@/lib/api-client";

type Call<T> = { data: T };

export async function getWithdrawalOverview(_call?: Call<undefined>) {
  return apiRequest<any>("/api/organizer/withdrawals");
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
  return apiRequest<any>("/api/organizer/withdrawals", {
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
export async function getReceipt({ data }: Call<{ id: string }>) {
  return apiRequest<any>(`/api/organizer/withdrawals/${data.id}/receipt`);
}
