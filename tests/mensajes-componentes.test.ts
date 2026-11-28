import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** Componentes y páginas ya traducidos. La lista solo crece: cada tanda de la
 *  fase 5 añade los suyos y a partir de ahí no pueden volver al español fijo. */
const TRADUCIDOS = [
  "src/components/GarageManager.tsx",
  "src/components/cuenta/DireccionesCuenta.tsx",
  "src/components/cuenta/PedidosCuenta.tsx",
  "src/app/(store)/cuenta/page.tsx",
  "src/app/(store)/cuenta/LogoutButton.tsx",
  "src/components/site/SiteFooter.tsx",
  "src/app/(store)/carrito/page.tsx",
  "src/app/(store)/checkout/page.tsx",
  "src/app/(store)/pedido/[id]/page.tsx",
  "src/app/(store)/pedido/[id]/factura/page.tsx",
  "src/app/(store)/rastrear-pedido/page.tsx",
  "src/app/(store)/garantia/page.tsx",
  "src/app/(store)/garantia/GarantiaForm.tsx",
  "src/app/(store)/producto/[slug]/page.tsx",
  "src/app/(store)/comparar/page.tsx",
  "src/app/(store)/nosotros/page.tsx",
  "src/app/(store)/contacto/page.tsx",
  "src/app/(store)/servicios/page.tsx",
  "src/app/(store)/renta/page.tsx",
  "src/app/(store)/transportacion-de-carga/page.tsx",
  "src/app/(store)/politicas/[slug]/page.tsx",
  "src/app/(store)/preguntas-frecuentes/page.tsx",
  "src/app/(store)/blog/page.tsx",
  "src/app/(store)/novedades/page.tsx",
  "src/app/(store)/testimonios/page.tsx",
  "src/app/(store)/ofertas/page.tsx",
  "src/app/(store)/despiece/page.tsx",
  "src/app/(store)/catalogo/page.tsx",
  "src/app/(store)/marcas-y-modelos/page.tsx",
  "src/app/(store)/cuenta/restablecer/page.tsx",
  "src/components/AddToCart.tsx",
  "src/components/AuthForm.tsx",
  "src/components/VerifyBanner.tsx",
  "src/components/PasswordField.tsx",
  "src/components/TelegramLogin.tsx",
  "src/components/ProductCard.tsx",
  "src/components/ProductGallery.tsx",
  "src/components/Photo360.tsx",
  "src/components/Modelo3D.tsx",
  "src/components/ReviewForm.tsx",
  "src/components/WishlistButton.tsx",
  "src/components/CompareToggle.tsx",
  "src/components/PrintButton.tsx",
  "src/components/site/Captcha.tsx",
  "src/components/site/VehicleFinder.tsx",
  "src/components/site/PasosCompra.tsx",
  "src/components/site/SectionHead.tsx",
  "src/components/site/CategoryMarquee.tsx",
  "src/components/site/SiteHeader.tsx",
  "src/components/site/ActionRail.tsx",
  "src/components/site/BackToTop.tsx",
  "src/components/site/SubscribeForm.tsx",
  "src/components/brand/Logo.tsx",
  "src/components/despiece/DespieceViewer.tsx",
  "src/components/despiece/VehiclePicker.tsx",
];

const LITERALES = /["`]([^"`\n]{2,200})["`]/g;
const ACENTOS = /[áéíóúüñ¿¡]/i;
const PALABRAS = /\b(el|la|los|las|de|del|para|con|sin|tu|tus|Mis|Añadir|Añade|Guarda|Escribe|Ver|Buscar|Elige|pedidos|deseos|vehículos|direcciones|garaje|cuenta)\b/i;
// Rutas, anclas, claves de diccionario y clases no son texto para el visitante.
const NO_ES_TEXTO = /^(\/|#|https?:|[\d._-]+$|[a-z0-9-]+(\.[a-z0-9-]+)+$)/;
const IGNORAR_LINEA = /^\s*(\/\/|\*|\/\*)|className=|import |\bt\("|\bfrom "/;

/** Frase visible: lleva espacio o empieza en mayúscula. Un slug suelto no. */
const esFrase = (s: string) => /\s/.test(s) || /^[A-ZÁÉÍÓÚ¡¿]/.test(s);

describe("textos de los componentes ya traducidos", () => {
  it("no quedan literales visibles en español fuera del diccionario", () => {
    const culpables: string[] = [];
    for (const fichero of TRADUCIDOS) {
      readFileSync(fichero, "utf8").split("\n").forEach((linea, i) => {
        if (IGNORAR_LINEA.test(linea)) return;
        for (const m of linea.matchAll(LITERALES)) {
          const texto = m[1];
          if (NO_ES_TEXTO.test(texto) || !esFrase(texto)) continue;
          if (ACENTOS.test(texto) || PALABRAS.test(texto)) culpables.push(`${fichero}:${i + 1} «${texto.slice(0, 60)}»`);
        }
      });
    }
    expect(culpables).toEqual([]);
  });
});
