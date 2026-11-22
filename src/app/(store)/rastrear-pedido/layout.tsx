import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rastrear mi pedido",
  description: "Consulta el estado de tu pedido de Impacto Automotriz con el número de pedido y el contacto de la compra.",
  robots: { index: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
