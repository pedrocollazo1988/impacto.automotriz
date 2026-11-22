import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import ContenidoEditor from "@/components/admin/ContenidoEditor";
import { componer, SECCIONES } from "@/lib/contenido";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contenido de la web" };

export default async function ContenidoPage() {
  await requirePage("content");
  const filas = await prisma.contentBlock.findMany();
  const porClave = new Map(filas.map((f) => [f.key, f]));

  // Se compone con el texto de fábrica para que el editor muestre siempre lo que
  // se ve hoy en la web, aunque la sección no se haya tocado nunca.
  const valores = Object.fromEntries(SECCIONES.map((s) => [s.key, componer(s, porClave.get(s.key) ?? null)]));

  return (
    <>
      <PageHeader
        title="Contenido de la web"
        subtitle="Textos, servicios, datos de contacto y preguntas frecuentes. Los cambios se publican al guardar."
      />
      <ContenidoEditor secciones={SECCIONES} valores={valores} guardadas={[...porClave.keys()]} />
    </>
  );
}
