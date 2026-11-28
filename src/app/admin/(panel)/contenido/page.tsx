import { prisma } from "@/lib/prisma";
import { requirePage, textoPanel } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import ContenidoEditor from "@/components/admin/ContenidoEditor";
import { SECCIONES } from "@/lib/contenido";
import { componerSecciones, type FilaContenido, type IdiomaContenido } from "@/lib/contenido-server";
import { ordenarSecciones } from "@/lib/contenido-orden";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contenido de la web" };

export default async function ContenidoPage() {
  await requirePage("content");
  const filas = (await prisma.contentBlock.findMany()) as unknown as FilaContenido[];
  const secciones = ordenarSecciones(SECCIONES);

  // El editor trabaja con los dos idiomas a la vez: cada uno con lo guardado y,
  // donde no haya fila, con el texto de fábrica (traducido si es inglés) para
  // que se vea lo que la web muestra ahora mismo.
  const deIdioma = (lang: IdiomaContenido) =>
    componerSecciones(filas.filter((f) => (f.lang === "en" ? "en" : "es") === lang), lang);
  const valores = { es: deIdioma("es"), en: deIdioma("en") };
  const defectos = { es: componerSecciones([], "es"), en: componerSecciones([], "en") };
  const guardadas = {
    es: filas.filter((f) => f.lang !== "en").map((f) => f.key),
    en: filas.filter((f) => f.lang === "en").map((f) => f.key),
  };

  return (
    <>
      <PageHeader
        title={await textoPanel("Contenido de la web", "Website content")}
        subtitle={await textoPanel(
          "Textos, servicios, datos de contacto y preguntas frecuentes, en español y en inglés. Los cambios se publican al guardar.",
          "Texts, services, contact details and frequently asked questions, in Spanish and English. Changes go live when you save.",
        )}
      />
      <ContenidoEditor secciones={secciones} valores={valores} defectos={defectos} guardadas={guardadas} />
    </>
  );
}
