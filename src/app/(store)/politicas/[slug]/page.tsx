import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import Icon from "@/components/brand/Icon";

type Doc = { title: string; intro: string; sections: [string, string][] };
const DOCS: Record<string, Doc> = {
  envios: {
    title: "Envíos y entrega",
    intro: "Trabajamos con varias modalidades de entrega para que recibas tus piezas donde las necesites, en toda Cuba.",
    sections: [
      ["Modalidades", "Entrega a domicilio, mensajería a otras provincias, entrega en punto acordado y recogida en tienda. La disponibilidad depende de tu provincia y municipio y se muestra durante el checkout."],
      ["Tarifas", "El costo del envío se calcula automáticamente según el método elegido, la provincia y el municipio. Algunos métodos son gratuitos a partir de un importe mínimo de compra."],
      ["Plazos", "El plazo estimado se muestra al seleccionar el método de entrega. Los pedidos se preparan tras la confirmación del pago."],
      ["Seguimiento", "Recibirás un código de confirmación y podrás consultar el estado de tu pedido en cualquier momento."],
    ],
  },
  devoluciones: {
    title: "Devoluciones y garantía",
    intro: "Queremos que compres con confianza. Si algo no sale como esperabas, estamos para ayudarte.",
    sections: [
      ["Garantía", "Las piezas y accesorios cuentan con la garantía del vendedor frente a defectos de fabricación. El plazo puede variar según el producto."],
      ["Cambios y devoluciones", "Si la pieza no corresponde a lo solicitado o llega con daños, contáctanos dentro de las primeras 48 horas con fotos y tu número de pedido para gestionar el cambio o la devolución."],
      ["Condiciones", "El producto debe conservar su estado y embalaje original. Los gastos de envío de la devolución pueden variar según el caso."],
      ["Reembolsos", "Cuando corresponda un reembolso, se realiza por el mismo medio de pago o mediante un vale de compra, según acordemos."],
    ],
  },
  privacidad: {
    title: "Política de privacidad",
    intro: "Protegemos tus datos personales y los usamos solo para gestionar tus pedidos y mejorar tu experiencia.",
    sections: [
      ["Datos que recopilamos", "Nombre, correo, teléfono y dirección de entrega, necesarios para procesar y entregar tu pedido. Si creas una cuenta, también guardamos tu garaje, lista de deseos y valoraciones."],
      ["Uso de los datos", "Utilizamos tus datos para gestionar pedidos, enviarte notificaciones relacionadas y, si lo autorizas, enviarte novedades. No vendemos tus datos a terceros."],
      ["Seguridad", "Aplicamos medidas técnicas para proteger tu información. Las contraseñas se almacenan cifradas."],
      ["Tus derechos", "Puedes solicitar el acceso, la corrección o la eliminación de tus datos escribiéndonos por los canales de contacto."],
    ],
  },
  terminos: {
    title: "Términos de uso",
    intro: "Estas condiciones regulan el uso de la tienda y la compra de productos en Impacto Automotriz.",
    sections: [
      ["Productos y precios", "Los precios se muestran en USD y pueden actualizarse. El importe final se confirma al crear el pedido. Las imágenes son ilustrativas y pueden variar ligeramente del producto real."],
      ["Pedidos", "Un pedido queda confirmado tras la validación del pago y la verificación de existencias. Nos reservamos el derecho de cancelar pedidos con datos incorrectos o falta de stock, con reembolso total."],
      ["Compatibilidad", "La compatibilidad de las piezas se ofrece según los datos del fabricante y del vendedor. Recomendamos confirmar con los datos exactos de tu vehículo antes de comprar."],
      ["Uso del sitio", "Te comprometes a usar el sitio de forma lícita y a no interferir con su funcionamiento."],
    ],
  },
};

export function generateStaticParams() { return Object.keys(DOCS).map((slug) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const d = DOCS[(await params).slug];
  return { title: d?.title ?? "Políticas" };
}

export default async function Politica({ params }: { params: Promise<{ slug: string }> }) {
  const d = DOCS[(await params).slug];
  if (!d) notFound();
  return (
    <div>
      <section className="relative overflow-hidden bg-[color:var(--color-navy-deep)] text-white">
        <div aria-hidden className="absolute inset-0 blueprint opacity-60" />
        <div className="container-x relative py-14">
          <nav className="mb-3 flex items-center gap-1.5 text-xs text-white/50"><Link href="/" className="hover:text-white">Inicio</Link><Icon name="chevronRight" size={12} /><span>Políticas</span></nav>
          <h1 className="font-display text-4xl font-extrabold">{d.title}</h1>
          <p className="mt-3 max-w-2xl text-white/75">{d.intro}</p>
        </div>
      </section>
      <section className="container-x py-10">
        <div className="mx-auto max-w-3xl space-y-4">
          {d.sections.map(([t, b]) => (
            <div key={t} className="card p-6">
              <h2 className="font-display text-lg font-bold text-navy">{t}</h2>
              <p className="mt-2 leading-relaxed text-slate-600">{b}</p>
            </div>
          ))}
          <div className="card flex flex-wrap items-center justify-between gap-3 p-6">
            <p className="text-sm text-slate-600">¿Tienes más preguntas sobre esta política?</p>
            <Link href="/contacto" className="btn btn-primary">Contactar</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
