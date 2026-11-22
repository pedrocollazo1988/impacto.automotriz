import { leerPasarelas } from "@/lib/payment-gateways";
import { datosPublicos, disponiblesPara, esCobroAutomatico } from "@/lib/pasarelas";

// Métodos de pago que puede ver el comprador. Sale de lo configurado en el
// panel (no de variables de entorno) y respeta los importes mínimo y máximo.
export async function GET(req: Request) {
  const total = Number(new URL(req.url).searchParams.get("total") ?? "");
  const lista = await leerPasarelas();
  const visibles = disponiblesPara(Number.isFinite(total) ? total : 0, lista, (k) => lista.find((p) => p.key === k)?.creds ?? null);
  return Response.json({
    methods: visibles.map((p) => ({
      key: p.key,
      provider: p.provider,
      name: p.name,
      description: p.description,
      kind: p.kind,
      icon: p.icon,
      instructions: p.instructions,
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
