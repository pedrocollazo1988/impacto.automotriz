import "./globals.css";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

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
  openGraph: { type: "website", siteName: "Impacto Automotriz", locale: "es_CU" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#0b2a5b", colorScheme: "light" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${archivo.variable} ${manrope.variable} ${mono.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
