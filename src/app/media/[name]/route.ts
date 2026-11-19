import { readMedia } from "@/lib/storage";

// Sirve los archivos subidos desde el panel (base de datos, o disco en local).
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp|glb)$/.test(name)) return new Response("Not found", { status: 404 });
  const f = await readMedia(name);
  if (!f) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(f.data), {
    headers: {
      "Content-Type": f.mime,
      "Content-Length": String(f.data.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
