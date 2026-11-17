import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.PUBLIC_URL ?? "http://localhost:3000"),
  title: { default: "Impacto Automotriz | Piezas y accesorios", template: "%s | Impacto Automotriz" },
  description: "Piezas, accesorios y medios de transporte eléctrico. Busca por vehículo, mira la pieza en 3D y paga en línea.",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es"><body className="min-h-screen bg-white text-slate-800 antialiased">{children}</body></html>;
}
