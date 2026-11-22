import type { MetadataRoute } from "next";

const site = process.env.PUBLIC_URL ?? "http://localhost:3000";

const PRIVADO = ["/admin", "/api", "/cuenta", "/checkout", "/carrito", "/pedido", "/comparar"];

// Rastreadores de asistentes de IA. Se permiten a propósito: el objetivo es que
// ChatGPT, Claude, Perplexity y Gemini lean el catálogo y citen precios y
// compatibilidad correctos. Dejarlos pasar no cuesta ventas y sí da citas.
const IA = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "PerplexityBot", "Google-Extended", "Applebot-Extended", "CCBot"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVADO },
      { userAgent: IA, allow: "/", disallow: PRIVADO },
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
