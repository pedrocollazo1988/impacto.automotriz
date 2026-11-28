import "./globals.css";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SITE } from "@/lib/site";
import { PreferencesProvider } from "@/components/site/Preferences";
import { getLang } from "@/lib/i18n";

// Fuentes autoalojadas (variables) para que el build no dependa de la red de Google Fonts.
const archivo = localFont({ src: "./fonts/archivo-latin.woff2", weight: "500 800", variable: "--font-archivo", display: "swap" });
const manrope = localFont({ src: "./fonts/manrope-latin.woff2", weight: "400 700", variable: "--font-manrope", display: "swap" });
const mono = localFont({ src: "./fonts/jetbrains-latin.woff2", weight: "500 600", variable: "--font-mono", display: "swap" });

const site = process.env.PUBLIC_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: "Impacto Automotriz | Piezas, accesorios y transporte eléctrico", template: "%s · Impacto Automotriz" },
  description: "Piezas, accesorios y medios de transporte eléctrico. Busca por vehículo, paga en línea y recibe en tu provincia.",
  applicationName: "Impacto Automotriz",
  keywords: ["piezas", "autopartes", "accesorios", "transporte eléctrico", "Cuba", "repuestos"],
  openGraph: {
    type: "website", siteName: "Impacto Automotriz", locale: "es_CU",
    // Sin imagen, el enlace compartido sale sin miniatura y los asistentes que
    // citan la página no tienen nada que mostrar.
    images: [{ url: "/brand/logo.png", width: 480, height: 435, alt: "Impacto Automotriz" }],
  },
  twitter: { card: "summary", images: ["/brand/logo.png"] },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#0b2a5b", colorScheme: "light" };

// Identidad del negocio para buscadores y asistentes de IA: sin esto no hay
// forma fiable de atribuir la tienda a una dirección y un correo concretos.
const organizacion = {
  "@context": "https://schema.org",
  "@type": "Store",
  name: SITE.nombre,
  legalName: SITE.razonSocial,
  url: site,
  email: SITE.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Calle 29 No. 5408 e/ 54 y 56",
    addressLocality: "Artemisa",
    addressCountry: "CU",
  },
  openingHours: SITE.horario,
  areaServed: { "@type": "Country", name: "Cuba" },
};

const sitioWeb = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE.nombre,
  url: site,
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${site}/catalogo?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // El idioma viaja en la cookie para que el primer HTML salga ya traducido:
  // los componentes cliente lo reciben como valor inicial y no cambian al hidratar.
  const lang = await getLang();
  return (
    <html lang={lang} suppressHydrationWarning className={`${archivo.variable} ${manrope.variable} ${mono.variable}`}>
      <body className="min-h-screen antialiased">
        {/* Antes de pintar: evita el destello blanco al entrar en modo noche. */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem("theme")||"system";var d=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.dataset.theme=d?"dark":"light";document.documentElement.style.colorScheme=d?"dark":"light";}catch(e){}})()` }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([organizacion, sitioWeb]).replace(/</g, "\\u003c") }} />
        <PreferencesProvider initialLang={lang}>{children}</PreferencesProvider>
      </body>
    </html>
  );
}
