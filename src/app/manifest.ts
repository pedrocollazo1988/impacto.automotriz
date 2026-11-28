import type { MetadataRoute } from "next";
import { getT } from "@/lib/i18n";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { lang, t } = await getT();
  return {
    name: "Impacto Automotriz",
    short_name: "Impacto",
    description: t("meta.manifestDescription"),
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0b2a5b",
    lang,
    categories: ["shopping", "automotive"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
