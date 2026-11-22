import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { HttpError, requireAdmin } from "@/lib/auth";

// Vercel corta el cuerpo de una función en ~4,5 MB, así que un vídeo de 40 MB
// nunca llega a /api/admin/upload. Con Blob configurado el navegador sube el
// archivo directo al almacén y esta ruta solo firma el permiso.
const LIMITES: Record<string, number> = {
  "image/jpeg": 5,
  "image/png": 5,
  "image/webp": 5,
  "model/gltf-binary": 25,
  "model/gltf+json": 25,
  "video/mp4": 40,
  "video/webm": 40,
};

export async function POST(req: Request) {
  const body = (await req.json()) as HandleUploadBody;

  // El webhook de Vercel llega sin cookie; solo se exige sesión para firmar.
  if (body.type === "blob.generate-client-token") await requireAdmin(req, "media");

  const r = await handleUpload({
    body,
    request: req,
    onBeforeGenerateToken: async (_pathname, clientPayload) => {
      const tipo = (clientPayload ?? "").split("|")[0];
      const max = LIMITES[tipo];
      if (!max) throw new HttpError(415, "Tipo de archivo no admitido");
      return {
        allowedContentTypes: [tipo],
        maximumSizeInBytes: max * 1024 * 1024,
        addRandomSuffix: true,
      };
    },
    onUploadCompleted: async () => {},
  });
  return Response.json(r);
}
