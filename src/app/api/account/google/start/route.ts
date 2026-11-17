import crypto from "node:crypto";
import { cookies } from "next/headers";

// Inicio de sesión con Google (OAuth 2.0, flujo de código). Requiere GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET.
export async function GET() {
  if (!process.env.GOOGLE_CLIENT_ID) return new Response("Not found", { status: 404 });
  const state = crypto.randomBytes(24).toString("hex");
  (await cookies()).set("g_state", state, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 600 });
  const q = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, redirect_uri: `${process.env.PUBLIC_URL}/api/account/google/callback`, response_type: "code", scope: "openid email profile", state, prompt: "select_account" });
  return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${q}`, 302);
}
