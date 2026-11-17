import fs from "node:fs/promises";
import path from "node:path";
import { MIME, uploadDir } from "@/lib/storage";

// Sirve los archivos subidos a disco (cuando no se usa Vercel Blob).
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const m = /^[0-9a-f-]{36}\.(jpg|png|webp|glb)$/.exec(name);
  if (!m) return new Response("Not found", { status: 404 });
  try {
    const data = await fs.readFile(path.join(uploadDir(), name));
    return new Response(data, { headers: { "Content-Type": MIME[m[1]], "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" } });
  } catch { return new Response("Not found", { status: 404 }); }
}
