import { leerPasarelas } from "@/lib/payment-gateways";
import { disponiblesPara } from "@/lib/pasarelas";

// Métodos de pago que puede ver el comprador. Sale de lo configurado en el
// panel (no de variables de entorno) y respeta los importes mínimo y máximo.
export async function GET(req: Request) {
  const total = Number(new URL(req.url).searchParams.get("total") ?? "");
  const lista = await leerPasarelas();
  const visibles = disponiblesPara(Number.isFinite(total) ? total : 0, lista, (k) => lista.find((p) => p.key === k)?.creds ?? null);
  return Response.json({
    methods: visibles.map((p) => ({
      key: p.key, name: p.name, description: p.description, kind: p.kind,
      instructions: p.instructions, feePercent: p.feePercent,
    })),
    // Compatibilidad con el cliente anterior.
    tropipay: visibles.some((p) => p.key === "TROPIPAY"),
    qvapay: visibles.some((p) => p.key === "QVAPAY"),
  });
}
