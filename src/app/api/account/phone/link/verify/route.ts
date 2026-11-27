import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle } from "@/lib/auth";
import { requireCustomer } from "@/lib/customer-auth";
import { limit } from "@/lib/ratelimit";
import { normalizarTelefono, telefonoLegible } from "@/lib/phone";
import { verificarOtp } from "@/lib/otp";
import { errorOtp, errorJson } from "@/lib/otp-http";

const Body = z.object({ phone: z.string().min(4).max(30), code: z.string().regex(/^\d{6}$/) });

/** Confirma el código y guarda el teléfono en la cuenta con sesión abierta. */
export const POST = handle(async (req: Request) => {
  const me = await requireCustomer();
  try {
    await limit(req, "phone-link-verify", 12, 10 * 60_000);
    const b = Body.parse(await req.json());

    const telefono = normalizarTelefono(b.phone);
    if (!telefono) return errorJson("AUTH_PHONE_INVALID", 400);

    const r = await verificarOtp({ identifier: telefono, purpose: "link", codigo: b.code });
    if (!r.ok) return errorJson(r.codigo, 400);

    try {
      await prisma.customer.update({
        where: { id: me.id },
        data: { phoneE164: telefono, phoneVerifiedAt: new Date(), phone: telefonoLegible(telefono) },
      });
    } catch (e) {
      // Otro cliente pudo registrarlo entre la petición del código y la confirmación.
      if ((e as { code?: string }).code === "P2002") return errorJson("AUTH_PHONE_TAKEN", 409);
      throw e;
    }

    return Response.json({ ok: true });
  } catch (e) {
    const r = errorOtp(e);
    if (r) return r;
    throw e;
  }
});
