// Cálculo puro de la tarifa de entrega. Se separa de Prisma para poder
// probarlo sin base de datos y para que la regla sea la misma en el checkout
// y en el panel.
export type TarifaEntrega = {
  baseFee: unknown;
  ruleFee?: unknown;
  freeFromUsd?: unknown;
  subtotalUsd: number;
};

const numero = (v: unknown): number | null => {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

export function calcularTarifaEntrega({ baseFee, ruleFee, freeFromUsd, subtotalUsd }: TarifaEntrega): number {
  const base = Math.max(0, numero(baseFee) ?? 0);
  const regla = numero(ruleFee);
  const gratisDesde = numero(freeFromUsd);
  // «Gratis desde 0» no significa envío gratis: es un campo vacío mal
  // guardado. Solo se libera el envío con un umbral positivo.
  if (gratisDesde != null && gratisDesde > 0 && subtotalUsd >= gratisDesde) return 0;
  return Math.max(0, regla ?? base);
}
