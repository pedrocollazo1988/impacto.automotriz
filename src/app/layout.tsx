import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Archivo, Manrope, JetBrains_Mono } from "next/font/google";

const archivo = Archivo({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-archivo", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-manrope", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-mono", display: "swap" });

const site = process.env.PUBLIC_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: "Impacto Automotriz | Piezas, accesorios y transporte eléctrico", template: "%s · Impacto Automotriz" },
  description: "Piezas, accesorios y medios de transporte eléctrico. Busca por vehículo, mira la pieza en 3D, paga en línea y recibe en tu provincia.",
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
