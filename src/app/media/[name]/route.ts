import { readMedia } from "@/lib/storage";

// Sirve los archivos subidos desde el panel (base de datos, o disco en local).
// Los vídeos necesitan Range: sin él Safari no reproduce y ningún navegador
// puede avanzar dentro del vídeo (se lo descargaría entero antes de moverse).
const RANGO = /^bytes=(\d*)-(\d*)$/;

export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp|glb|gltf|mp4|webm)$/.test(name)) return new Response("Not found", { status: 404 });
  const f = await readMedia(name);
  if (!f) return new Response("Not found", { status: 404 });

  const buf = Buffer.from(f.data);
  const cabeceras: Record<string, string> = {
    "Content-Type": f.mime,
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    "Accept-Ranges": "bytes",
  };

  const m = RANGO.exec(req.headers.get("range") ?? "");
  if (m) {
    const total = buf.length;
    const desde = m[1] ? Number(m[1]) : 0;
    const hasta = m[2] ? Math.min(Number(m[2]), total - 1) : total - 1;
    if (Number.isNaN(desde) || desde > hasta || desde >= total) {
      return new Response(null, { status: 416, headers: { ...cabeceras, "Content-Range": `bytes */${total}` } });
    }
    const trozo = buf.subarray(desde, hasta + 1);
    return new Response(trozo, {
      status: 206,
      headers: { ...cabeceras, "Content-Length": String(trozo.length), "Content-Range": `bytes ${desde}-${hasta}/${total}` },
    });
  }

  return new Response(buf, { headers: { ...cabeceras, "Content-Length": String(buf.length) } });
}
