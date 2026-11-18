import type { MetadataRoute } from "next";

const site = process.env.PUBLIC_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/cuenta", "/checkout", "/carrito", "/pedido", "/comparar"] },
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
