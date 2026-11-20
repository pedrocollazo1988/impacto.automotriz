import ExcelJS from "exceljs";
import { saveProduct } from "./catalog";

const num = (v: string) => Number(v.trim().replace(",", "."));
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

function cellStr(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "string") return v;
  const o = v as { result?: unknown; text?: unknown; richText?: { text: string }[] };
  if (o.richText) return o.richText.map((r) => r.text).join("");
  if (o.result !== undefined) return cellStr(o.result);
  if (o.text !== undefined) return String(o.text);
  return "";
}
// Primera hoja del .xlsx → filas de texto (igual que un CSV)
export async function xlsxToRows(buf: Buffer): Promise<string[][]> {
  const wb = new ExcelJS.Workbook(); await wb.xlsx.load(buf as unknown as ArrayBuffer);
  const ws = wb.worksheets[0]; const rows: string[][] = [];
  ws?.eachRow({ includeEmpty: false }, (row) => { const r: string[] = []; for (let c = 1; c <= row.cellCount; c++) r.push(cellStr(row.getCell(c).value)); if (r.some((x) => x.trim())) rows.push(r); });
  return rows;
}

// «Clave: valor|Clave: valor». Los pares incompletos se descartan.
export function parseSpecs(v: string): Record<string, string> {
  return Object.fromEntries(
    v.split("|")
      .map((x) => x.split(/:(.*)/s).map((t) => t.trim()))
      .filter(([k, val]) => k && val),
  );
}

// Importa filas (cabecera + datos). Columnas: sku, nombre, precio, existencias, categoria, [marca, descripcion, imagenes, modelo3d, destacado, compatibilidad, especificaciones]
export async function importRows(rows: string[][]) {
  const head = rows[0].map(norm); const col = (r: string[], n: string) => (r[head.indexOf(n)] ?? "").trim();
  for (const need of ["sku", "nombre", "precio", "existencias", "categoria"]) if (!head.includes(need)) throw new Error(`Falta la columna «${need}»`);
  let created = 0, updated = 0; const errors: { fila: number; error: string }[] = [];
  for (const [idx, r] of rows.slice(1).entries()) {
    try {
      const price = num(col(r, "precio")), stock = Number(col(r, "existencias"));
      if (!col(r, "sku") || !col(r, "nombre") || !col(r, "categoria") || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) throw new Error("Datos incompletos o inválidos");
      const fits = col(r, "compatibilidad").split("|").filter(Boolean).map((x) => { const [make, model, a, b] = x.split(":").map((t) => t.trim()); if (!make || !model || !+a || !+b) throw new Error(`Compatibilidad inválida «${x}»`); return { make, model, yearFrom: +a, yearTo: +b }; });
      // Sin pares válidos se omite, para no borrar las que ya tenga la ficha.
      const specs = parseSpecs(col(r, "especificaciones"));
      const { created: c } = await saveProduct({
        sku: col(r, "sku"), name: col(r, "nombre"), priceUsd: price, stock, categoryName: col(r, "categoria"), brandName: col(r, "marca") || null, description: col(r, "descripcion"),
        images: col(r, "imagenes").split("|").map((u) => u.trim()).filter(Boolean), model3dUrl: col(r, "modelo3d") || null,
        specs: Object.keys(specs).length ? specs : undefined,
        featured: /^(si|sí|1|true|x)$/i.test(col(r, "destacado")), fits: head.includes("compatibilidad") ? fits : undefined,
      });
      c ? created++ : updated++;
    } catch (e) { errors.push({ fila: idx + 2, error: e instanceof Error ? e.message : "Error" }); }
  }
  return { created, updated, errors };
}
