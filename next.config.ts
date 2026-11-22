import type { NextConfig } from "next";
const config: NextConfig = {
  poweredByHeader: false,
  images: {
    // Solo los orígenes donde de verdad viven las fotos. Con "**" cualquiera
    // podía usar /_next/image?url=... como proxy para descargar de dominios
    // ajenos con la IP y el ancho de banda del proyecto.
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "impacto-automotriz.vercel.app" },
    ],
    // Escalones más finos en la zona móvil: sin 320/360/420 el navegador salta
    // de 256 a 384 px y descarga hasta un 40 % más de bytes de los necesarios.
    // AVIF pesa ~22 % menos que WebP en estas fotos; el navegador elige por
    // Accept y los navegadores viejos siguen recibiendo WebP.
    formats: ["image/avif", "image/webp"],
    // Sin esto Next cachea 60 s y el navegador revalida en cada visita: las
    // fotos se vuelven a descargar enteras. Son assets que no cambian de
    // contenido (si cambia el producto, cambia el nombre del archivo).
    minimumCacheTTL: 2678400,
    deviceSizes: [320, 360, 420, 480, 640, 768, 1024, 1280, 1920, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 192, 256, 384],
  },
  async headers() {
    // CSP: Next inyecta scripts inline con nonce en el HTML, pero el nonce cambia
    // en cada petición y el HTML es estático, así que se permite 'unsafe-inline'
    // solo para scripts. Lo que de verdad corta un XSS aquí es no poder cargar
    // scripts de terceros ni enviar datos a dominios ajenos (connect/img/form).
    const csp = [
      "default-src 'self'",
      // 'wasm-unsafe-eval' lo exige el visor 3D de Google: compila WebAssembly
      // para decodificar el glTF. No abre eval() de JavaScript, solo WASM.
      "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
      // Vercel inyecta su barra de feedback solo en las previsualizaciones; en
      // produccion no se sirve, asi que el dominio real mantiene la CSP cerrada.
      ...(process.env.VERCEL_ENV === "production" ? [] : ["script-src-elem 'self' 'unsafe-inline' https://vercel.live", "frame-src 'self' https://vercel.live"]),
    ].join("; ");
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Content-Security-Policy", value: csp },
      // La tienda no usa cámara, micrófono ni geolocalización: negarlos evita
      // que un script inyectado o un iframe los solicite.
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "X-DNS-Prefetch-Control", value: "on" },
    ] }];
  },
};
export default config;
