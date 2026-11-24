import { cookies } from "next/headers";
import { z } from "zod";
import { audit, handle, loginStaff, sessionToken, SESSION_COOKIE } from "@/lib/auth";
import { limit, limitKey } from "@/lib/ratelimit";
import { requireTurnstile } from "@/lib/turnstile";

export const POST = handle(async (req: Request) => {
  await limit(req, "admin-login", 5);
  const b = z.object({ email: z.string().email().max(160), password: z.string().max(200), turnstileToken: z.string().max(2048).optional() }).parse(await req.json());
  await requireTurnstile(req, b.turnstileToken);
  await limitKey(b.email.toLowerCase(), "admin-login-email", 10, 15 * 60_000);
  const s = await loginStaff(b.email, b.password);
  (await cookies()).set(SESSION_COOKIE, sessionToken(s.id), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 8 * 3600 });
  await audit(s, "login");
  return Response.json({ ok: true });
});
export const DELETE = handle(async () => { (await cookies()).delete(SESSION_COOKIE); return Response.json({ ok: true }); });
