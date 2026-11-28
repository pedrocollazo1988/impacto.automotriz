import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/auth";

/** Comprueba la geografía contra la base y devuelve los nombres oficiales: el
 *  navegador manda ids, nunca nombres, para que no acabe uno inventado. */
export async function geoValida(provinceId: number, municipalityId: number) {
  const m = await prisma.municipality.findFirst({
    where: { id: municipalityId, provinceId },
    select: { id: true, name: true, province: { select: { id: true, name: true } } },
  });
  if (!m) throw new HttpError(400, "dir.errMunicipality");
  return { municipalityId: m.id, municipalityName: m.name, provinceId: m.province.id, provinceName: m.province.name };
}
