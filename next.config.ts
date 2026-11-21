import type { NextConfig } from "next";
const config: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    // Escalones más finos en la zona móvil: sin 320/360/420 el navegador salta
    // de 256 a 384 px y descarga hasta un 40 % más de bytes de los necesarios.
    deviceSizes: [320, 360, 420, 480, 640, 768, 1024, 1280, 1920, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 192, 256, 384],
  },
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    ] }];
  },
};
export default config;
