import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit, handle, requireAdmin, errorPanel } from "@/lib/auth";
import { cifrar, descifrar, driversDelPanel, leerPasarelas, limpiarConfig, limpiarCreds } from "@/lib/payment-gateways";
import { DRIVERS, PRESETS, claveValida, driverDe, esDriverId, slugify } from "@/lib/pasarelas";

// Gestión de métodos de pago desde el panel. Nunca se devuelven credenciales en
// claro: solo si están puestas. Los datos públicos (banco, cuenta, URL) sí se
// devuelven porque el comprador los necesita.

const Body = z.object({
  id: z.number().int().positive().optional(),
  key: z.string().max(40).optional(),
  provider: z.string().max(20).optional(),
  name: z.string().min(2).max(60).optional(),
  description: z.string().max(200).optional(),
  icon: z.string().max(30).optional(),
  enabled: z.boolean().optional(),
  sandbox: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(99).optional(),
  instructions: z.string().max(4000).optional(),
  feePercent: z.number().min(0).max(30).optional(),
  minTotalUsd: z.number().min(0).nullish(),
  maxTotalUsd: z.number().min(0).nullish(),
  config: z.record(z.string(), z.union([z.string(), z.boolean()])).optional(),
  creds: z.record(z.string(), z.string()).optional(),
  revocar: z.boolean().optional(),
});

const publico = (p: Awaited<ReturnType<typeof leerPasarelas>>[number]) => {
  const driver = driverDe(p);
  const config: Record<string, string> = {};
  for (const c of driver.campos) {
    if (c.secreto) continue;
    // Compatibilidad con filas antiguas, que guardaban todo en credsEnc.
    const valor = p.config?.[c.campo] ?? p.creds?.[c.campo];
    if (valor !== undefined) config[c.campo] = valor;
  }
  return {
    id: p.id,
    key: p.key,
    provider: p.provider,
    name: p.name,
    description: p.description,
    kind: p.kind,
    icon: p.icon,
    enabled: p.enabled,
    archived: p.archived,
    sandbox: p.sandbox,
    sortOrder: p.sortOrder,
    instructions: p.instructions,
    feePercent: p.feePercent,
    minTotalUsd: p.minTotalUsd,
    maxTotalUsd: p.maxTotalUsd,
    config,
    creds: Object.fromEntries(driver.campos.filter((c) => c.secreto).map((c) => [c.campo, p.creds?.[c.campo] ? "definido" : ""])),
  };
};

export const GET = handle(async (req: Request) => {
  await requireAdmin(req, "payments");
  const methods = await leerPasarelas();
  return Response.json({
    methods: methods.map(publico),
    drivers: driversDelPanel(),
    presets: PRESETS,
  });
});

export const POST = handle(async (req: Request) => {
  const u = await requireAdmin(req, "payments");
  const b = Body.parse(await req.json());

  if (b.minTotalUsd != null && b.maxTotalUsd != null && b.minTotalUsd > b.maxTotalUsd) {
    throw await errorPanel(422, "El mínimo no puede superar al máximo", "The minimum cannot exceed the maximum");
  }

  if (b.id) {
    const actual = await prisma.paymentGateway.findUnique({ where: { id: b.id } });
    if (!actual) throw await errorPanel(404, "Método de pago desconocido", "Unknown payment method");
    const provider = esDriverId(actual.provider) ? actual.provider : "manual";
    const driver = DRIVERS[provider];

    if (b.revocar) {
      const row = await prisma.paymentGateway.update({ where: { id: actual.id }, data: { credsEnc: null, enabled: false } });
      await audit(u, "pago.revocar", row.key);
      return Response.json({ ok: true });
    }

    // Los secretos se mezclan: un campo vacío NO borra lo guardado.
    const previos = descifrar(actual.credsEnc) ?? {};
    const nuevos = b.creds ? limpiarCreds(provider, b.creds) : {};
    const mezcla = { ...previos, ...nuevos };

    // Los datos públicos sí se pueden vaciar: el formulario manda todos los
    // campos del driver, así que una cadena vacía significa "borrar".
    const previaConfig = (actual.config && typeof actual.config === "object" && !Array.isArray(actual.config))
      ? Object.fromEntries(Object.entries(actual.config as Record<string, unknown>).map(([k, v]) => [k, String(v ?? "")]))
      : {};
    const config = b.config ? { ...previaConfig, ...limpiarConfig(provider, b.config) } : previaConfig;
    for (const c of driver.campos) {
      if (!c.secreto && c.tipo !== "checkbox" && config[c.campo] === "") delete config[c.campo];
    }

    const row = await prisma.paymentGateway.update({
      where: { id: actual.id },
      data: {
        name: b.name ?? actual.name,
        description: b.description ?? actual.description,
        icon: b.icon ?? actual.icon,
        enabled: b.enabled ?? actual.enabled,
        sandbox: b.sandbox ?? actual.sandbox,
        sortOrder: b.sortOrder ?? actual.sortOrder,
        instructions: b.instructions ?? actual.instructions,
        feePercent: b.feePercent ?? actual.feePercent,
        minTotalUsd: b.minTotalUsd === undefined ? actual.minTotalUsd : b.minTotalUsd,
        maxTotalUsd: b.maxTotalUsd === undefined ? actual.maxTotalUsd : b.maxTotalUsd,
        config,
        credsEnc: Object.keys(mezcla).length ? cifrar(mezcla) : null,
      },
    });
    await audit(u, "pago.configurar", row.key);
    return Response.json({ ok: true, id: row.id, key: row.key });
  }

  // Alta: el driver es obligatorio; la clave se genera del nombre si no viene.
  if (!b.provider || !esDriverId(b.provider)) throw await errorPanel(422, "Elige un tipo de método de pago", "Choose a payment method type");
  if (!b.name || b.name.trim().length < 2) throw await errorPanel(422, "El nombre es obligatorio", "The name is required");
  const provider = b.provider;
  const driver = DRIVERS[provider];

  const base = b.key?.trim() || slugify(b.name);
  if (!claveValida(base)) throw await errorPanel(422, "La clave solo admite letras, números, guion y guion bajo", "The key only allows letters, numbers, hyphen and underscore");
  let key = base;
  if (await prisma.paymentGateway.findUnique({ where: { key } })) {
    if (b.key) throw await errorPanel(409, "Ya existe un método con esa clave", "A method with that key already exists");
    let n = 2;
    while (await prisma.paymentGateway.findUnique({ where: { key } })) key = `${base}-${n++}`;
  }

  const config = b.config ? limpiarConfig(provider, b.config) : {};
  const secretos = b.creds ? limpiarCreds(provider, b.creds) : {};
  const row = await prisma.paymentGateway.create({
    data: {
      key,
      provider,
      name: b.name.trim(),
      description: b.description ?? "",
      kind: driver.kind,
      icon: b.icon ?? driver.icono,
      enabled: b.enabled ?? true,
      sandbox: b.sandbox ?? true,
      sortOrder: b.sortOrder ?? 0,
      instructions: b.instructions ?? "",
      feePercent: b.feePercent ?? 0,
      minTotalUsd: b.minTotalUsd ?? null,
      maxTotalUsd: b.maxTotalUsd ?? null,
      config,
      credsEnc: Object.keys(secretos).length ? cifrar(secretos) : null,
    },
  });
  await audit(u, "pago.crear", `${row.key} (${provider})`);
  return Response.json({ ok: true, id: row.id, key: row.key }, { status: 201 });
});

// Archivar conserva los pedidos antiguos; revocar solo borra las credenciales.
export const DELETE = handle(async (req: Request) => {
  const u = await requireAdmin(req, "payments");
  const url = new URL(req.url);
  const id = Number(url.searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) throw await errorPanel(400, "Método no válido", "Invalid method");
  const actual = await prisma.paymentGateway.findUnique({ where: { id } });
  if (!actual) throw await errorPanel(404, "Método de pago desconocido", "Unknown payment method");
  const revocar = url.searchParams.get("mode") === "creds";
  await prisma.paymentGateway.update({
    where: { id },
    data: revocar ? { credsEnc: null, enabled: false } : { archived: true, enabled: false },
  });
  await audit(u, revocar ? "pago.revocar" : "pago.archivar", actual.key);
  return Response.json({ ok: true });
});
