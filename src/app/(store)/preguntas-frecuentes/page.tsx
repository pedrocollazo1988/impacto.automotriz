import Link from "next/link";
import Icon from "@/components/brand/Icon";
export const metadata = { title: "Preguntas frecuentes" };

const FAQS: [string, string][] = [
  ["¿Cómo sé si una pieza es compatible con mi vehículo?", "En cada ficha indicamos las marcas, modelos y años compatibles. Además, puedes buscar por vehículo desde el inicio o guardar tus vehículos en «Mi garaje» para ver solo piezas compatibles. Si tienes dudas, escríbenos por WhatsApp con la marca, modelo y año."],
  ["¿Qué métodos de pago aceptan?", "Aceptamos Tropipay y QvaPay (pago en línea), transferencia bancaria y pago en efectivo contra entrega o en el local. La confirmación del pago en línea es automática; la transferencia y el efectivo los confirmamos manualmente."],
  ["¿Hacen entregas en toda Cuba?", "Sí. Ofrecemos entrega a domicilio, mensajería a otras provincias, entrega en punto acordado y recogida en tienda. Las tarifas y los tiempos dependen de la provincia y el municipio."],
  ["¿Puedo comprar sin crear una cuenta?", "Sí, puedes comprar como invitado. Crear una cuenta te permite seguir tus pedidos, guardar tu garaje, tu lista de deseos y valorar los productos que compres."],
  ["¿Qué es el visor 3D y la realidad aumentada?", "En algunos productos puedes girar, acercar y ver la pieza en pantalla completa. En móviles compatibles, puedes verla en tu espacio real con la realidad aumentada. Si el modelo no puede mostrarse, verás la fotografía de respaldo."],
  ["¿Cómo sigo el estado de mi pedido?", "Al confirmar la compra recibirás un número de pedido. Puedes consultar su estado en «Mi cuenta» o con el enlace del pedido. Te notificamos por correo cada cambio de estado."],
  ["¿Puedo devolver un producto?", "Consulta nuestra política de devoluciones y garantía. Si la pieza no corresponde o llega con daños, contáctanos para gestionar el cambio o la devolución según las condiciones aplicables."],
  ["¿Tienen factura o comprobante?", "Sí, cada pedido genera un comprobante imprimible que puedes guardar como PDF desde la página del pedido."],
];

export default function FAQ() {
  return (
    <div>
      <section className="relative overflow-hidden bg-[color:var(--color-navy-deep)] text-white">
        <div aria-hidden className="absolute inset-0 blueprint opacity-60" />
        <div className="container-x relative py-14">
          <span className="eyebrow eyebrow-light">Ayuda</span>
          <h1 className="mt-2 font-display text-4xl font-extrabold">Preguntas frecuentes</h1>
          <p className="mt-3 max-w-2xl text-white/75">Resolvemos las dudas más comunes sobre compras, pagos, entregas y compatibilidad de piezas.</p>
        </div>
      </section>
      <section className="container-x py-10">
        <div className="mx-auto max-w-3xl space-y-3">
          {FAQS.map(([q, a]) => (
            <details key={q} className="card group p-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-display font-bold text-navy">
                {q}
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500 transition group-open:rotate-45"><Icon name="plus" size={16} /></span>
              </summary>
              <p className="mt-3 leading-relaxed text-slate-600">{a}</p>
            </details>
          ))}
          <div className="card mt-6 flex flex-wrap items-center justify-between gap-3 p-5">
            <p className="text-sm text-slate-600">¿No encuentras la respuesta que buscas?</p>
            <Link href="/contacto" className="btn btn-primary">Contactar</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
