import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const purchaseSchema = z.object({
  slug: z.string().min(1),
  ticketTypeId: z.string().uuid(),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email(),
  phone: z.string().max(40).optional(),
  promoCode: z.string().max(40).optional(),
  ref: z.string().max(60).optional(),
});

export const purchaseTicket = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => purchaseSchema.parse(data))
  .handler(async ({ data }) => {
    const { createPaidOrder } = await import("./nawo.server");
    return createPaidOrder(data);
  });

export const getTicket = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ ticketId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { loadTicket } = await import("./nawo.server");
    return loadTicket(data.ticketId);
  });

export const hostLogin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ code: z.string().min(4).max(40) }).parse(data))
  .handler(async ({ data }) => {
    const { hostSignIn } = await import("./nawo.server");
    return hostSignIn(data.code);
  });

export const scanTicketFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        code: z.string().min(4).max(40),
        qrToken: z.string().min(4).max(120),
        sessionId: z.string().uuid().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { scanTicket } = await import("./nawo.server");
    return scanTicket(data.code, data.qrToken, data.sessionId);
  });

export const scanStats = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({ code: z.string().min(4).max(40), sessionId: z.string().uuid().optional() })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { scanCount } = await import("./nawo.server");
    return scanCount(data.code, data.sessionId);
  });
