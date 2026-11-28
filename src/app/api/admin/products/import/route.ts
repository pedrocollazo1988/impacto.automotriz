import { audit, handle, requireAdmin, errorPanel, HttpError, textoPanel } from "@/lib/auth";
import { parseCsv } from "@/lib/catalog";
import { getLang } from "@/lib/i18n";
import { importRows, xlsxToRows } from "@/lib/import";

// Carga masiva desde Excel (.xlsx) o CSV UTF-8. Actualiza por SKU si ya existe. Máximo 1000 filas y 10 MB.
export const POST = handle(async (req: Request) => {
  const u = await requireAdmin(req, "products");
  const lang = await getLang();
  const buf = Buffer.from(await req.arrayBuffer());
  if (buf.length > 10 * 1024 * 1024) throw await errorPanel(413, "El archivo supera 10 MB", "The file exceeds 10 MB");
  const xlsx = (req.headers.get("x-filename") ?? "").toLowerCase().endsWith(".xlsx");
  let rows: string[][];
  if (xlsx) {
    try { rows = await xlsxToRows(buf); }
    catch { throw await errorPanel(400, "No se pudo leer el archivo Excel", "Could not read the Excel file"); }
  } else rows = parseCsv(buf.toString("utf8"));
  if (rows.length < 2) throw await errorPanel(400, "El archivo no tiene filas de datos", "The file has no data rows");
  if (rows.length > 1001) throw await errorPanel(400, "Máximo 1000 productos por carga", "Maximum 1000 products per upload");
  let res;
  try { res = await importRows(rows, { actor: u.name, lang }); }
  catch (e) {
    if (e instanceof Error) throw new HttpError(400, e.message); // ya viene traducido por importRows
    throw await errorPanel(400, "Archivo inválido", "Invalid file");
  }
  await audit(u, "producto.importar", await textoPanel(`${res.created} nuevos, ${res.updated} actualizados, ${res.errors.length} errores`, `${res.created} created, ${res.updated} updated, ${res.errors.length} errors`));
  return Response.json(res);
});
