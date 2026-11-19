import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Impacto Automotriz",
    short_name: "Impacto",
    description: "Piezas, accesorios y medios de transporte eléctrico. Busca por vehículo, mira la pieza en 3D y paga en línea.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0b2a5b",
    lang: "es",
    categories: ["shopping", "automotive"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
