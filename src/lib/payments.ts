import { createPaymentLink } from "./tropipay";
import { createInvoice } from "./qvapay";

export const tropipayEnabled = () => !!process.env.TROPIPAY_CLIENT_ID && !!process.env.TROPIPAY_CLIENT_SECRET;
export async function createOnlinePayment(o: { id: string; number: number; totalUsd: number; method: "TROPIPAY" | "QVAPAY" }): Promise<{ url: string; ref?: string }> {
  if (o.method === "QVAPAY") { const r = await createInvoice({ orderId: o.id, number: o.number, totalUsd: o.totalUsd }); return { url: r.url, ref: r.uuid }; }
  return { url: await createPaymentLink({ orderId: o.id, number: o.number, totalUsd: o.totalUsd }) };
}
