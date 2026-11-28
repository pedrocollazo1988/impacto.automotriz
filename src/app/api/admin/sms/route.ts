import { z } from "zod";
import { audit, handle, requireAdmin } from "@/lib/auth";
import { limit } from "@/lib/ratelimit";
import { normalizarTelefono } from "@/lib/phone";
import { getLang } from "@/lib/i18n";
import { mensajePrueba, estadoSms, proveedorSms } from "@/lib/sms";

export const dynamic = "force-dynamic";

/** Estado del envío de SMS: proveedor activo y variables que faltan (nunca credenciales). */
export const GET = handle(async (req: Request) => {
  await requireAdmin(req, "email");
  return Response.json(estadoSms());
});

const Body = z.object({ telefono: z.string().min(4).max(30) });

/** Prueba real: manda un mensaje de configuración al número que indique el equipo. */
export const POST = handle(async (req: Request) => {
  const u = await requireAdmin(req, "email");
  await limit(req, "sms-prueba", 5, 10 * 60_000);
  const b = Body.parse(await req.json());
  const telefono = normalizarTelefono(b.telefono);
  if (!telefono) return Response.json({ error: "AUTH_PHONE_INVALID" }, { status: 400 });

  const estado = estadoSms();
  if (!estado.listo) return Response.json({ error: "sms_sin_configurar", proveedor: estado.proveedor, faltan: estado.faltan }, { status: 400 });

  const lang = await getLang();
  const r = await proveedorSms().enviarCodigo({ to: telefono, codigo: "", lang, texto: mensajePrueba(lang) });
  await audit(u, "sms.prueba", `${estado.proveedor} · ${telefono.slice(0, 5)}****${telefono.slice(-2)} · ${r.ok ? "ok" : r.error ?? "error"}`);
  if (!r.ok) return Response.json({ error: r.error ?? "sms_error" }, { status: 502 });
  return Response.json({ ok: true, proveedor: estado.proveedor });
});
