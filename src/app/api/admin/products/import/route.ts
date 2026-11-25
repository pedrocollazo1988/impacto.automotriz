import { audit, handle, requireAdmin, HttpError } from "@/lib/auth";
import { parseCsv } from "@/lib/catalog";
import { importRows, xlsxToRows } from "@/lib/import";

// Carga masiva desde Excel (.xlsx) o CSV UTF-8. Actualiza por SKU si ya existe. Máximo 1000 filas y 10 MB.
export const POST = handle(async (req: Request) => {
  const u = await requireAdmin(req, "products");
  const buf = Buffer.from(await req.arrayBuffer());
  if (buf.length > 10 * 1024 * 1024) throw new HttpError(413, "El archivo supera 10 MB");
  const xlsx = (req.headers.get("x-filename") ?? "").toLowerCase().endsWith(".xlsx");
  const rows = xlsx ? await xlsxToRows(buf).catch(() => { throw new HttpError(400, "No se pudo leer el archivo Excel"); }) : parseCsv(buf.toString("utf8"));
  if (rows.length < 2) throw new HttpError(400, "El archivo no tiene filas de datos");
  if (rows.length > 1001) throw new HttpError(400, "Máximo 1000 productos por carga");
  const res = await importRows(rows, { actor: u.name }).catch((e) => { throw new HttpError(400, e instanceof Error ? e.message : "Archivo inválido"); });
  await audit(u, "producto.importar", `${res.created} nuevos, ${res.updated} actualizados, ${res.errors.length} errores`);
  return Response.json(res);
});
