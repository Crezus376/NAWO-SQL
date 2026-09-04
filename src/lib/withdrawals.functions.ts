import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getWithdrawalOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getBalance, listOrganizerWithdrawals, MIN_WITHDRAWAL, FEE_RATE } = await import(
      "./withdrawals.server"
    );
    const [balance, withdrawals] = await Promise.all([
      getBalance(context.userId),
      listOrganizerWithdrawals(context.userId),
    ]);
    return { balance, withdrawals, minimum: MIN_WITHDRAWAL, feeRate: FEE_RATE };
  });

export const requestWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        amount: z.number().nonnegative(),
        fullBalance: z.boolean().default(false),
        payoutMethod: z.string().min(2).max(60),
        payoutDetails: z.string().min(3).max(200),
        eventId: z.string().uuid().optional(),
        note: z.string().max(500).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { createWithdrawal } = await import("./withdrawals.server");
    return createWithdrawal(context.userId, data);
  });

export const adminListWithdrawals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { listAllWithdrawals } = await import("./withdrawals.server");
    return listAllWithdrawals(context.userId);
  });

export const adminProcessWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "processing", "paid", "rejected", "cancelled"]),
        reference: z.string().max(120).optional(),
        comment: z.string().max(500).optional(),
        proofPath: z.string().max(300).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { processWithdrawal } = await import("./withdrawals.server");
    return processWithdrawal(context.userId, data);
  });

export const getReceipt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { getWithdrawalReceipt } = await import("./withdrawals.server");
    return getWithdrawalReceipt(context.userId, data.id);
  });
