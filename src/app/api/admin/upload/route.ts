import { audit, handle, requireAdmin, HttpError } from "@/lib/auth";
import { saveUpload } from "@/lib/storage";

export const POST = handle(async (req: Request) => {
  const u = await requireAdmin(req, "media");
  const file = (await req.formData()).get("file");
  if (!(file instanceof File)) throw new HttpError(400, "Falta el archivo");
  const url = await saveUpload(file);
  await audit(u, "archivo.subir", url);
  return Response.json({ url });
});
