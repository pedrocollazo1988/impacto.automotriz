import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { startCustomerSession } from "@/lib/customer-auth";

const back = (p: string) => Response.redirect(new URL(p, process.env.PUBLIC_URL), 302);
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams; const jar = await cookies();
  const state = jar.get("g_state")?.value; jar.delete("g_state");
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !state || state !== sp.get("state") || !sp.get("code")) return back("/cuenta?error=google");
  try {
    const t = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code: sp.get("code")!, client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, redirect_uri: `${process.env.PUBLIC_URL}/api/account/google/callback`, grant_type: "authorization_code" }) });
    if (!t.ok) return back("/cuenta?error=google");
    const u = await (await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${(await t.json()).access_token}` } })).json();
    if (!u.sub || !u.email || u.email_verified !== true) return back("/cuenta?error=google");
    const email = String(u.email).toLowerCase();
    // Google ya verificó el correo: se vincula con la cuenta existente o se crea una nueva.
    const c = (await prisma.customer.findUnique({ where: { googleId: u.sub } })) ?? (await prisma.customer.findUnique({ where: { email } }));
    const cust = c
      ? await prisma.customer.update({ where: { id: c.id }, data: { googleId: u.sub, emailVerified: true } })
      : await prisma.customer.create({ data: { email, name: String(u.name ?? email.split("@")[0]).slice(0, 120), googleId: u.sub, emailVerified: true } });
    await startCustomerSession(cust.id);
    return back("/cuenta");
  } catch { return back("/cuenta?error=google"); }
}
