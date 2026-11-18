import Icon from "@/components/brand/Icon";

// Botón flotante de WhatsApp. El mensaje cambia por página vía `context`.
export default function WhatsAppFab({ context }: { context?: string }) {
  const wa = process.env.NEXT_PUBLIC_WHATSAPP;
  if (!wa) return null;
  const text = encodeURIComponent(context ? `Hola, quiero consultar sobre ${context}` : "Hola, quiero hacer una consulta sobre sus productos");
  return (
    <a
      href={`https://wa.me/${wa}?text=${text}`}
      target="_blank" rel="noopener" aria-label="Escribir por WhatsApp"
      className="group fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#25D366] py-3 pl-3 pr-4 font-semibold text-white shadow-[0_16px_40px_-12px_rgba(37,211,102,.8)] transition hover:scale-105"
    >
      <span className="grid h-7 w-7 place-items-center rounded-full bg-white/20"><Icon name="whatsapp" size={20} /></span>
      <span className="hidden text-sm sm:inline">Consultar</span>
    </a>
  );
}
