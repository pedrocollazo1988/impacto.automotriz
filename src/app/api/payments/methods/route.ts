import { leerPasarelas } from "@/lib/payment-gateways";
import { datosPublicos, disponiblesPara, esCobroAutomatico } from "@/lib/pasarelas";
import { prisma } from "@/lib/prisma";

// Métodos de pago que puede ver el comprador. Sale de lo configurado en el
// panel (no de variables de entorno) y respeta los importes mínimo y máximo.
export async function GET(req: Request) {
  const total = Number(new URL(req.url).searchParams.get("total") ?? "");
  const lista = await leerPasarelas();
  const visibles = disponiblesPara(Number.isFinite(total) ? total : 0, lista, (k) => lista.find((p) => p.key === k)?.creds ?? null);
  // leerPasarelas() normaliza a los campos del driver; el texto inglés se lee
  // aparte para que el checkout pueda resolverlo en el idioma activo.
  const textos = await prisma.paymentGateway.findMany({
    where: { key: { in: visibles.map((p) => p.key) } },
    select: { key: true, nameEn: true, descriptionEn: true, instructionsEn: true },
  });
  const en = new Map(textos.map((x) => [x.key, x]));
  return Response.json({
    methods: visibles.map((p) => ({
      key: p.key,
      provider: p.provider,
      name: p.name,
      nameEn: en.get(p.key)?.nameEn ?? null,
      description: p.description,
      descriptionEn: en.get(p.key)?.descriptionEn ?? null,
      kind: p.kind,
      icon: p.icon,
      instructions: p.instructions,
      instructionsEn: en.get(p.key)?.instructionsEn ?? null,
      feePercent: p.feePercent,
      automatic: esCobroAutomatico(p),
      details: datosPublicos(p),
      url: p.provider === "link" ? p.config?.url ?? null : null,
    })),
    // Compatibilidad con clientes anteriores.
    tropipay: visibles.some((p) => p.provider === "tropipay"),
    qvapay: visibles.some((p) => p.provider === "qvapay"),
  });
}
