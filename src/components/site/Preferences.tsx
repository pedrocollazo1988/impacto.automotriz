"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import Icon from "@/components/brand/Icon";

export type Tema = "light" | "dark" | "system";
export type Idioma = "es" | "en";

const DICCIONARIO: Record<Idioma, Record<string, string>> = {
  es: {
    "nav.catalogo": "Catálogo", "nav.ofertas": "Ofertas", "nav.marcas": "Marcas y modelos",
    "nav.despiece": "Despiece", "nav.novedades": "Novedades", "nav.contacto": "Contacto",
    "nav.nosotros": "Nosotros", "nav.testimonios": "Testimonios", "nav.faq": "Preguntas frecuentes",
    "nav.renta": "Renta y leasing",
    "header.search": "Busca por nombre, código o referencia…", "header.searchShort": "Buscar piezas…",
    "header.searchBtn": "Buscar", "header.compare": "Comparar", "header.cart": "Carrito",
    "header.wishlist": "Lista de deseos", "header.account": "Mi cuenta", "header.menu": "Abrir menú",
    "rail.faq": "Preguntas frecuentes", "rail.whatsapp": "WhatsApp", "rail.up": "Subir al inicio",
    "cart.title": "Carrito", "cart.empty": "Tu carrito está vacío", "cart.emptyHint": "Explora el catálogo y añade las piezas que necesitas.",
    "cart.viewCatalog": "Ver catálogo", "cart.updating": "Actualizando precios y existencias…", "cart.unit": "USD / unidad",
    "cart.onlyLeft": "Solo quedan {n} disponibles", "cart.remove": "Quitar", "cart.summary": "Resumen",
    "cart.subtotal": "Subtotal", "cart.shipping": "Envío", "cart.calcAtCheckout": "Se calcula en el checkout",
    "cart.estimatedTotal": "Total estimado", "cart.checkout": "Finalizar compra", "cart.adjust": "Ajusta las cantidades marcadas para continuar.",
    "cart.keepShopping": "Seguir comprando", "cart.secure": "Pago seguro · precios verificados en el servidor",
    "cart.ttlSaved": "Se guarda {h} h", "cart.ttlUntil": "Se guarda {h} h · hasta {date}",
    "cart.ttlNote": "Los productos no descuentan existencia hasta que confirmas el pedido. Si el carrito caduca, las unidades siguen disponibles.",
    "cart.stockNote": "Los productos se guardan {h} horas. Si no confirmas, el carrito se vacía y las unidades vuelven a estar disponibles.",
    "checkout.title": "Finalizar compra", "checkout.empty": "Tu carrito está vacío", "checkout.viewCatalog": "Ver catálogo",
    "checkout.stepData": "Tus datos", "checkout.name": "Nombre completo", "checkout.email": "Correo electrónico", "checkout.phone": "Teléfono",
    "checkout.stepDelivery": "Entrega", "checkout.deliveryHint": "El precio del servicio de entrega se calcula al elegir provincia y municipio. Se confirma al seleccionar el método.",
    "checkout.stepPayment": "Pago", "checkout.noPayments": "No hay métodos de pago disponibles ahora mismo. Escríbenos para coordinar el cobro.",
    "checkout.auto": "Automático", "checkout.manual": "Manual", "checkout.commission": "+{n} % de comisión",
    "checkout.coupon": "Cupón de descuento", "checkout.code": "Código de descuento", "checkout.apply": "Aplicar",
    "checkout.summary": "Tu pedido", "checkout.subtotal": "Subtotal", "checkout.discount": "Descuento", "checkout.deliveryFee": "Servicio de entrega",
    "checkout.paymentFee": "Comisión de pago", "checkout.total": "Total", "checkout.payWith": "Pagas con",
    "checkout.stockWarn": "Hay productos por encima del stock disponible.", "checkout.adjustCart": "Ajusta el carrito",
    "checkout.missing": "Falta completar:", "checkout.confirm": "Confirmar pedido", "checkout.processing": "Procesando…",
    "checkout.pressConfirm": "Pulsa «Confirmar pedido» y te indicaremos qué dato falta.", "checkout.finalNote": "El importe final lo confirma el servidor.",
    "checkout.review": "Revisa los datos marcados antes de confirmar el pedido.", "checkout.adjustStock": "Ajusta las cantidades del carrito: superan el stock disponible",
    "checkout.choosePayment": "Elige un método de pago para continuar", "checkout.createError": "No se pudo crear el pedido",
    "checkout.couponOk": "Cupón {code} aplicado", "checkout.couponBad": "Cupón no válido",
    "delivery.province": "Provincia…", "delivery.municipality": "Municipio…", "delivery.days": "días", "delivery.free": "Gratis",
    "delivery.pickup": "Punto de recogida…", "delivery.address": "Dirección completa", "delivery.reference": "Entre calles / referencia (opcional)",
    "delivery.slot": "Franja horaria…", "delivery.gift": "Es para un familiar o tercero en Cuba", "delivery.recipient": "Quien recibe (nombre)",
    "delivery.phone": "Teléfono", "delivery.ci": "Carnet de identidad (opcional)", "delivery.missing": "Para confirmar la entrega falta: {list}.",
    "delivery.missingName": "nombre de quien recibe", "delivery.missingPhone": "teléfono de quien recibe", "delivery.missingAddress": "dirección completa", "delivery.missingPickup": "punto de recogida",
    "theme.light": "Día", "theme.dark": "Noche", "theme.system": "Sistema",
    "theme.change": "Cambiar tema",
    "lang.change": "Cambiar idioma",
  },
  en: {
    "nav.catalogo": "Catalog", "nav.ofertas": "Deals", "nav.marcas": "Makes and models",
    "nav.despiece": "Parts diagrams", "nav.novedades": "New arrivals", "nav.contacto": "Contact",
    "nav.nosotros": "About us", "nav.testimonios": "Reviews", "nav.faq": "FAQ",
    "nav.renta": "Rent and leasing",
    "header.search": "Search by name, code or reference…", "header.searchShort": "Search parts…",
    "header.searchBtn": "Search", "header.compare": "Compare", "header.cart": "Cart",
    "header.wishlist": "Wishlist", "header.account": "My account", "header.menu": "Open menu",
    "rail.faq": "FAQ", "rail.whatsapp": "WhatsApp", "rail.up": "Back to top",
    "cart.title": "Cart", "cart.empty": "Your cart is empty", "cart.emptyHint": "Browse the catalog and add the parts you need.",
    "cart.viewCatalog": "View catalog", "cart.updating": "Updating prices and stock…", "cart.unit": "USD / unit",
    "cart.onlyLeft": "Only {n} left", "cart.remove": "Remove", "cart.summary": "Summary",
    "cart.subtotal": "Subtotal", "cart.shipping": "Shipping", "cart.calcAtCheckout": "Calculated at checkout",
    "cart.estimatedTotal": "Estimated total", "cart.checkout": "Checkout", "cart.adjust": "Adjust the highlighted quantities to continue.",
    "cart.keepShopping": "Keep shopping", "cart.secure": "Secure payment · prices verified on the server",
    "cart.ttlSaved": "Saved for {h} h", "cart.ttlUntil": "Saved for {h} h · until {date}",
    "cart.ttlNote": "Products do not reduce stock until you confirm the order. If the cart expires, the units remain available.",
    "cart.stockNote": "Products are saved for {h} hours. If you do not confirm, the cart is emptied and the units become available again.",
    "checkout.title": "Checkout", "checkout.empty": "Your cart is empty", "checkout.viewCatalog": "View catalog",
    "checkout.stepData": "Your details", "checkout.name": "Full name", "checkout.email": "Email", "checkout.phone": "Phone",
    "checkout.stepDelivery": "Delivery", "checkout.deliveryHint": "The delivery price is calculated when you choose province and municipality. It is confirmed when you select a method.",
    "checkout.stepPayment": "Payment", "checkout.noPayments": "No payment methods are available right now. Contact us to arrange payment.",
    "checkout.auto": "Automatic", "checkout.manual": "Manual", "checkout.commission": "+{n}% fee",
    "checkout.coupon": "Discount coupon", "checkout.code": "Discount code", "checkout.apply": "Apply",
    "checkout.summary": "Your order", "checkout.subtotal": "Subtotal", "checkout.discount": "Discount", "checkout.deliveryFee": "Delivery",
    "checkout.paymentFee": "Payment fee", "checkout.total": "Total", "checkout.payWith": "Paying with",
    "checkout.stockWarn": "Some products exceed available stock.", "checkout.adjustCart": "Adjust cart",
    "checkout.missing": "Missing:", "checkout.confirm": "Place order", "checkout.processing": "Processing…",
    "checkout.pressConfirm": "Press “Place order” and we will tell you what is missing.", "checkout.finalNote": "The final amount is confirmed by the server.",
    "checkout.review": "Review the highlighted fields before placing the order.", "checkout.adjustStock": "Adjust cart quantities: they exceed available stock",
    "checkout.choosePayment": "Choose a payment method to continue", "checkout.createError": "Could not create the order",
    "checkout.couponOk": "Coupon {code} applied", "checkout.couponBad": "Invalid coupon",
    "delivery.province": "Province…", "delivery.municipality": "Municipality…", "delivery.days": "days", "delivery.free": "Free",
    "delivery.pickup": "Pickup point…", "delivery.address": "Full address", "delivery.reference": "Between streets / reference (optional)",
    "delivery.slot": "Time slot…", "delivery.gift": "It is for a relative or third party in Cuba", "delivery.recipient": "Recipient (name)",
    "delivery.phone": "Phone", "delivery.ci": "ID number (optional)", "delivery.missing": "To confirm delivery, missing: {list}.",
    "delivery.missingName": "recipient name", "delivery.missingPhone": "recipient phone", "delivery.missingAddress": "full address", "delivery.missingPickup": "pickup point",
    "theme.light": "Light", "theme.dark": "Dark", "theme.system": "System",
    "theme.change": "Change theme",
    "lang.change": "Change language",
  },
};

type Ctx = {
  theme: Tema; setTheme: (t: Tema) => void;
  lang: Idioma; setLang: (l: Idioma) => void;
  t: (key: string) => string;
};
const C = createContext<Ctx | null>(null);
export const usePreferences = () => {
  const c = useContext(C);
  if (!c) throw new Error("PreferencesProvider ausente");
  return c;
};

const aplicarTema = (t: Tema) => {
  const oscuro = t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", oscuro);
  document.documentElement.dataset.theme = oscuro ? "dark" : "light";
  document.documentElement.style.colorScheme = oscuro ? "dark" : "light";
};

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Tema>("system");
  const [lang, setLangState] = useState<Idioma>("es");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("theme");
    const l = localStorage.getItem("lang");
    if (t === "light" || t === "dark" || t === "system") setThemeState(t);
    if (l === "es" || l === "en") setLangState(l);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    aplicarTema(theme);
    localStorage.setItem("theme", theme);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const alCambiar = () => { if (theme === "system") aplicarTema("system"); };
    mq.addEventListener("change", alCambiar);
    return () => mq.removeEventListener("change", alCambiar);
  }, [theme, ready]);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = lang;
    localStorage.setItem("lang", lang);
  }, [lang, ready]);

  const setTheme = (t: Tema) => setThemeState(t);
  const setLang = (l: Idioma) => setLangState(l);
  const t = (key: string) => DICCIONARIO[lang][key] ?? DICCIONARIO.es[key] ?? key;
  return <C.Provider value={{ theme, setTheme, lang, setLang, t }}>{children}</C.Provider>;
}

const ORDEN: Tema[] = ["light", "dark", "system"];
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme, t } = usePreferences();
  const icono = theme === "dark" ? "moon" : theme === "light" ? "sun" : "monitor";
  const actual = t(`theme.${theme}`);
  return (
    <button
      type="button"
      onClick={() => setTheme(ORDEN[(ORDEN.indexOf(theme) + 1) % ORDEN.length])}
      className="flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition hover:bg-white/10"
      title={`${t("theme.change")}: ${actual}`}
      aria-label={`${t("theme.change")}: ${actual}`}
    >
      <Icon name={icono} size={14} />
      {!compact && <span>{actual}</span>}
    </button>
  );
}

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, t } = usePreferences();
  return (
    <button
      type="button"
      onClick={() => setLang(lang === "es" ? "en" : "es")}
      className="flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition hover:bg-white/10"
      title={t("lang.change")}
      aria-label={t("lang.change")}
    >
      <Icon name="globe" size={14} />
      {!compact && <span>{lang.toUpperCase()}</span>}
    </button>
  );
}
