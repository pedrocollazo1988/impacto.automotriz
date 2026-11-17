import { qvapayEnabled } from "@/lib/qvapay";
import { tropipayEnabled } from "@/lib/payments";
export async function GET() { return Response.json({ tropipay: tropipayEnabled(), qvapay: qvapayEnabled() }); }
